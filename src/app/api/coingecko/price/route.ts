import { NextResponse } from "next/server";
import { getTokenPrices } from "@/lib/coingecko";

export const runtime = "edge";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids");

    if (!ids) {
        return NextResponse.json({ error: "Missing 'ids' parameter" }, { status: 400 });
    }

    try {
        const prices = await getTokenPrices(ids.split(","));

        return NextResponse.json({
            prices,
            attribution: "Data provided by CoinGecko",
        });
    } catch (error) {
        console.error("CoinGecko price API error:", error);
        return NextResponse.json(
            { error: "Price data temporarily unavailable. Please try again." },
            { status: 503 }
        );
    }
}
