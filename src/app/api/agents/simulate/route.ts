import { NextResponse } from "next/server";
import {
    simulateProposals,
    generateActivityFeed,
    DEMO_AGENTS,
} from "@/lib/agents/agent-simulator";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { intentId, inputAmount, assetName } = body;

        if (!intentId || !inputAmount) {
            return NextResponse.json(
                { error: "Missing intentId or inputAmount" },
                { status: 400 }
            );
        }

        // Simulate agents taking 2-8 seconds to respond
        const proposals = simulateProposals(intentId, inputAmount, assetName || "RWA Token");

        return NextResponse.json({
            proposals,
            agents: DEMO_AGENTS,
            simulatedAt: Date.now(),
        });
    } catch (error) {
        console.error("Agent simulation error:", error);
        return NextResponse.json(
            { error: "Agent simulation failed" },
            { status: 500 }
        );
    }
}

export async function GET() {
    const activities = generateActivityFeed(25);
    return NextResponse.json({
        activities,
        agents: DEMO_AGENTS,
    });
}
