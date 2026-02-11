import { NextResponse } from "next/server";
import { getMarketChart } from "@/lib/coingecko";

export const runtime = "edge";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get("id");
    const days = searchParams.get("days") || "7";

    if (!coinId) {
        return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    try {
        const chart = await getMarketChart(coinId, days);

        return NextResponse.json({
            chart,
            attribution: "Data provided by CoinGecko",
        });
    } catch (error) {
        console.error("CoinGecko chart API error:", error);
        return NextResponse.json(
            { error: "Chart data temporarily unavailable" },
            { status: 503 }
        );
    }
}
