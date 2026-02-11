/**
 * CoinGecko API Service Layer
 * 
 * Provides cached access to CoinGecko's cryptocurrency data API.
 * Uses in-memory caching to respect the free tier rate limit (30 calls/min, 10K/month).
 * All responses include CoinGecko attribution per their terms of use.
 */

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const API_KEY = process.env.COINGECKO_API_KEY || "";

// In-memory cache for serverless functions (persists within same instance)
const cache = new Map<string, { data: unknown; expiry: number }>();

function getCacheKey(endpoint: string, params: Record<string, string> = {}): string {
    const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
    return `${endpoint}:${sorted.map(([k, v]) => `${k}=${v}`).join("&")}`;
}

async function cachedFetch<T>(
    endpoint: string,
    params: Record<string, string> = {},
    ttlSeconds = 60
): Promise<T> {
    const key = getCacheKey(endpoint, params);
    const cached = cache.get(key);

    if (cached && cached.expiry > Date.now()) {
        return cached.data as T;
    }

    const url = new URL(`${COINGECKO_BASE}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const headers: Record<string, string> = {
        Accept: "application/json",
    };

    if (API_KEY) {
        headers["x-cg-demo-api-key"] = API_KEY;
    }

    const response = await fetch(url.toString(), { headers, next: { revalidate: ttlSeconds } });

    if (!response.ok) {
        if (response.status === 429) {
            // Rate limited: return cached data if available, even if stale
            if (cached) return cached.data as T;
            throw new Error("CoinGecko API rate limit exceeded. Please try again shortly.");
        }
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    cache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });

    return data as T;
}

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface CoinGeckoAsset {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number | null;
    total_volume: number;
    price_change_percentage_24h: number;
    price_change_percentage_7d_in_currency?: number;
    sparkline_in_7d?: { price: number[] };
    circulating_supply: number;
    total_supply: number | null;
    ath: number;
    ath_change_percentage: number;
}

export interface CoinGeckoCategory {
    id: string;
    name: string;
    market_cap: number;
    market_cap_change_24h: number;
    volume_24h: number;
    top_3_coins: string[];
}

export interface CoinGeckoGlobal {
    active_cryptocurrencies: number;
    markets: number;
    total_market_cap: { usd: number };
    total_volume: { usd: number };
    market_cap_percentage: { btc: number; eth: number };
    market_cap_change_percentage_24h_usd: number;
}

export interface MarketChartData {
    prices: [number, number][];
    market_caps: [number, number][];
    total_volumes: [number, number][];
}

export interface TrendingCoin {
    item: {
        id: string;
        coin_id: number;
        name: string;
        symbol: string;
        market_cap_rank: number;
        thumb: string;
        small: string;
        large: string;
        slug: string;
        price_btc: number;
        score: number;
        data: {
            price: number;
            price_change_percentage_24h: { usd: number };
            market_cap: string;
            total_volume: string;
            sparkline: string;
        };
    };
}

// ----------------------------------------------------------------
// API Functions
// ----------------------------------------------------------------

/**
 * Get RWA tokens by CoinGecko category.
 * Categories: real-world-assets-rwa, tokenized-gold, stablecoins
 */
export async function getRWATokens(
    category = "real-world-assets-rwa",
    page = 1,
    perPage = 50
): Promise<CoinGeckoAsset[]> {
    return cachedFetch<CoinGeckoAsset[]>(
        "/coins/markets",
        {
            vs_currency: "usd",
            category,
            order: "market_cap_desc",
            per_page: perPage.toString(),
            page: page.toString(),
            sparkline: "true",
            price_change_percentage: "7d",
        },
        120 // 2 minute cache for list data
    );
}

/**
 * Get real-time price for specific coin IDs.
 */
export async function getTokenPrices(
    ids: string[]
): Promise<Record<string, { usd: number; usd_24h_change: number; usd_market_cap: number; usd_24h_vol: number }>> {
    return cachedFetch(
        "/simple/price",
        {
            ids: ids.join(","),
            vs_currencies: "usd",
            include_24hr_change: "true",
            include_market_cap: "true",
            include_24hr_vol: "true",
        },
        30 // 30 second cache for prices
    );
}

/**
 * Get historical price chart for a coin.
 */
export async function getMarketChart(
    coinId: string,
    days: string = "7"
): Promise<MarketChartData> {
    return cachedFetch<MarketChartData>(
        `/coins/${coinId}/market_chart`,
        {
            vs_currency: "usd",
            days,
        },
        300 // 5 minute cache for chart data
    );
}

/**
 * Get detailed coin info.
 */
export async function getCoinDetail(coinId: string) {
    return cachedFetch(
        `/coins/${coinId}`,
        {
            localization: "false",
            tickers: "false",
            community_data: "false",
            developer_data: "false",
            sparkline: "true",
        },
        120
    );
}

/**
 * Get CoinGecko categories list.
 */
export async function getCategories(): Promise<CoinGeckoCategory[]> {
    return cachedFetch<CoinGeckoCategory[]>(
        "/coins/categories",
        { order: "market_cap_desc" },
        300 // 5 minute cache
    );
}

/**
 * Get trending coins on CoinGecko.
 */
export async function getTrending(): Promise<{ coins: TrendingCoin[] }> {
    return cachedFetch<{ coins: TrendingCoin[] }>(
        "/search/trending",
        {},
        120
    );
}

/**
 * Get global crypto market data.
 */
export async function getGlobalData(): Promise<{ data: CoinGeckoGlobal }> {
    return cachedFetch<{ data: CoinGeckoGlobal }>(
        "/global",
        {},
        120
    );
}

// ----------------------------------------------------------------
// RWA-specific helpers
// ----------------------------------------------------------------

export const RWA_CATEGORIES = [
    { id: "real-world-assets-rwa", label: "All RWAs", icon: "Globe" },
    { id: "tokenized-treasury", label: "Treasuries", icon: "Landmark" },
    { id: "tokenized-real-estate", label: "Real Estate", icon: "Building2" },
    { id: "tokenized-gold", label: "Commodities", icon: "Gem" },
    { id: "stablecoins", label: "Stablecoins", icon: "DollarSign" },
] as const;

export type RWACategoryId = (typeof RWA_CATEGORIES)[number]["id"];
