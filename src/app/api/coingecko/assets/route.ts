import { NextResponse } from "next/server";
import { getRWATokens, type CoinGeckoAsset } from "@/lib/coingecko";
import { CURATED_RWA_TOKENS } from "@/data/rwa-curated";

export const runtime = "edge";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "real-world-assets-rwa";
    const page = parseInt(searchParams.get("page") || "1");

    try {
        const assets = await getRWATokens(category, page, 50);

        return NextResponse.json({
            assets,
            category,
            page,
            attribution: "Data provided by CoinGecko",
            attributionUrl: "https://www.coingecko.com",
        });
    } catch (error) {
        // Fallback to curated list if CoinGecko is unavailable
        console.error("CoinGecko API error, using curated fallback:", error);

        const fallbackAssets: Partial<CoinGeckoAsset>[] = CURATED_RWA_TOKENS.map((token) => ({
            id: token.id,
            symbol: token.symbol.toLowerCase(),
            name: token.name,
            image: "",
            current_price: 0,
            market_cap: 0,
            market_cap_rank: null,
            total_volume: 0,
            price_change_percentage_24h: 0,
            circulating_supply: 0,
            total_supply: null,
            ath: 0,
            ath_change_percentage: 0,
        }));

        return NextResponse.json({
            assets: fallbackAssets,
            category,
            page,
            fallback: true,
            attribution: "Data provided by CoinGecko",
            attributionUrl: "https://www.coingecko.com",
        });
    }
}
