/**
 * Curated RWA token list mapped to CoinGecko IDs.
 * These are well-known tokenized real-world assets across categories.
 * Used as fallback when CoinGecko category endpoints are rate-limited.
 */

export interface CuratedToken {
    id: string;        // CoinGecko coin ID
    symbol: string;
    name: string;
    category: string;
    chains: string[];
    description: string;
}

export const CURATED_RWA_TOKENS: CuratedToken[] = [
    // Treasuries & Government Bonds
    {
        id: "ondo-us-dollar-yield",
        symbol: "USDY",
        name: "Ondo US Dollar Yield",
        category: "treasuries",
        chains: ["ethereum", "arbitrum", "base"],
        description: "Tokenized US Treasury yield-bearing stablecoin by Ondo Finance",
    },
    {
        id: "ondo-finance",
        symbol: "ONDO",
        name: "Ondo Finance",
        category: "treasuries",
        chains: ["ethereum"],
        description: "Protocol for tokenized securities and treasury products",
    },
    {
        id: "mountain-protocol-usdm",
        symbol: "USDM",
        name: "Mountain Protocol USD",
        category: "treasuries",
        chains: ["ethereum", "polygon", "arbitrum", "base"],
        description: "Yield-bearing stablecoin backed by US Treasuries",
    },
    {
        id: "backed-ib01-treasury-bond-0-1yr",
        symbol: "bIB01",
        name: "Backed IB01 Treasury Bond",
        category: "treasuries",
        chains: ["ethereum"],
        description: "Tokenized iShares Treasury Bond 0-1yr ETF",
    },
    {
        id: "ethena-staked-usde",
        symbol: "sUSDe",
        name: "Ethena Staked USDe",
        category: "treasuries",
        chains: ["ethereum"],
        description: "Staked USDe with delta-neutral yield",
    },
    // Real Estate
    {
        id: "parcl",
        symbol: "PRCL",
        name: "Parcl",
        category: "real-estate",
        chains: ["solana"],
        description: "Real estate price index protocol",
    },
    {
        id: "landx-governance-token",
        symbol: "LNDX",
        name: "LandX Finance",
        category: "real-estate",
        chains: ["ethereum", "arbitrum"],
        description: "Tokenized agricultural real estate yields",
    },
    {
        id: "propchain",
        symbol: "PROPC",
        name: "Propchain",
        category: "real-estate",
        chains: ["ethereum"],
        description: "Fractional real estate investment platform",
    },
    // Commodities
    {
        id: "pax-gold",
        symbol: "PAXG",
        name: "PAX Gold",
        category: "commodities",
        chains: ["ethereum"],
        description: "Each token is backed by one fine troy ounce of London Good Delivery gold",
    },
    {
        id: "tether-gold",
        symbol: "XAUT",
        name: "Tether Gold",
        category: "commodities",
        chains: ["ethereum"],
        description: "Gold-backed stablecoin by Tether",
    },
    {
        id: "cache-gold",
        symbol: "CGT",
        name: "CACHE Gold",
        category: "commodities",
        chains: ["ethereum"],
        description: "Each token represents 1 gram of pure gold stored in vaults",
    },
    // Stablecoins (as fiat-backed RWAs)
    {
        id: "usd-coin",
        symbol: "USDC",
        name: "USD Coin",
        category: "stablecoins",
        chains: ["ethereum", "arbitrum", "base", "polygon", "solana"],
        description: "Fully reserved fiat-backed stablecoin by Circle",
    },
    {
        id: "tether",
        symbol: "USDT",
        name: "Tether USD",
        category: "stablecoins",
        chains: ["ethereum", "arbitrum", "polygon"],
        description: "Largest fiat-collateralized stablecoin",
    },
    {
        id: "dai",
        symbol: "DAI",
        name: "Dai",
        category: "stablecoins",
        chains: ["ethereum", "arbitrum", "base", "polygon"],
        description: "Decentralized stablecoin by MakerDAO, partially backed by RWAs",
    },
];

export const CURATED_CATEGORIES = [
    { id: "treasuries", label: "Treasuries", description: "Government bond tokens and yield-bearing assets" },
    { id: "real-estate", label: "Real Estate", description: "Tokenized property and land investments" },
    { id: "commodities", label: "Commodities", description: "Gold, silver, and commodity-backed tokens" },
    { id: "stablecoins", label: "Stablecoins", description: "Fiat-collateralized stable tokens" },
];

/**
 * Get CoinGecko IDs for a specific category (for batch price fetching).
 */
export function getCoinIdsForCategory(category: string): string[] {
    return CURATED_RWA_TOKENS
        .filter((t) => t.category === category)
        .map((t) => t.id);
}

/**
 * Get all curated CoinGecko IDs.
 */
export function getAllCoinIds(): string[] {
    return CURATED_RWA_TOKENS.map((t) => t.id);
}
