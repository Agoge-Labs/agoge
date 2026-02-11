/**
 * Agent Simulator
 * 
 * Generates realistic AI agent proposals for demo purposes.
 * Creates the visual "agents competing" experience without
 * needing actual running agents or LLM calls.
 */

import { generateId } from "@/lib/utils";

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface SimulatedAgent {
    id: string;
    name: string;
    avatar: string;  // emoji
    specialization: string;
    address: string;
    reputation: number;
    totalFulfillments: number;
    successRate: number;
    avgExecutionTime: number;
    stake: number;
    isActive: boolean;
}

export interface SimulatedProposal {
    id: string;
    intentId: string;
    agent: SimulatedAgent;
    expectedOutput: number;
    estimatedTime: number;       // seconds
    confidence: number;          // 0 to 100
    route: string;
    gasEstimate: number;
    submittedAt: number;
    analysis: string;            // LLM-style analysis text
}

export interface SimulatedActivity {
    id: string;
    agent: SimulatedAgent;
    type: "discovery" | "proposal" | "fulfillment" | "analysis";
    action: string;
    details?: string;
    confidence?: number;
    expectedOutput?: number;
    timestamp: number;
}

// ----------------------------------------------------------------
// Predefined Agents
// ----------------------------------------------------------------

export const DEMO_AGENTS: SimulatedAgent[] = [
    {
        id: "agent-001",
        name: "TreasuryHawk",
        avatar: "\u{1F985}",
        specialization: "treasuries,bonds",
        address: "0x7a3B1F62c2E5d8A4b9C0D3e2F1a5B8c7D6e4F3a2",
        reputation: 94,
        totalFulfillments: 847,
        successRate: 96.2,
        avgExecutionTime: 28,
        stake: 5.2,
        isActive: true,
    },
    {
        id: "agent-002",
        name: "RealEstateOracle",
        avatar: "\u{1F3D7}",
        specialization: "real-estate,property",
        address: "0x2b4C8D6e1F3a5B7c9D0E2f4A6b8C1d3E5f7A9b0C",
        reputation: 87,
        totalFulfillments: 523,
        successRate: 91.5,
        avgExecutionTime: 45,
        stake: 3.8,
        isActive: true,
    },
    {
        id: "agent-003",
        name: "GoldDigger",
        avatar: "\u{1F48E}",
        specialization: "commodities,gold,silver",
        address: "0x4d6E8F0a2B4c6D8e0F2a4B6c8D0e2F4a6B8c0D2e",
        reputation: 91,
        totalFulfillments: 694,
        successRate: 94.1,
        avgExecutionTime: 32,
        stake: 4.5,
        isActive: true,
    },
    {
        id: "agent-004",
        name: "CrossChainNinja",
        avatar: "\u{26A1}",
        specialization: "cross-chain,bridges",
        address: "0x6f8A0b2C4d6E8f0A2b4C6d8E0f2A4b6C8d0E2f4a",
        reputation: 89,
        totalFulfillments: 612,
        successRate: 93.0,
        avgExecutionTime: 22,
        stake: 4.1,
        isActive: true,
    },
    {
        id: "agent-005",
        name: "YieldFarmer",
        avatar: "\u{1F33E}",
        specialization: "yield,stablecoins,defi",
        address: "0x8a0B2c4D6e8F0a2b4C6d8E0F2a4B6c8D0e2F4a6b",
        reputation: 85,
        totalFulfillments: 436,
        successRate: 89.7,
        avgExecutionTime: 38,
        stake: 3.2,
        isActive: true,
    },
];

// ----------------------------------------------------------------
// Simulation Functions
// ----------------------------------------------------------------

const ROUTES = [
    "Base -> USDC -> DEX Swap -> Target Token (direct)",
    "Base -> Across Bridge -> Arbitrum -> DEX -> Target Token",
    "Base -> USDC -> 1inch Aggregator -> Best Rate -> Target Token",
    "Base -> Stargate Bridge -> Optimism -> UniswapV3 -> Target Token",
    "Base -> Native Bridge -> Ethereum -> Curve Pool -> Target Token",
];

const ANALYSIS_TEMPLATES = [
    "Strong buy signal detected. Current price is {pct}% below 7-day moving average. Liquidity pool depth supports execution without significant slippage. Recommend immediate execution via {route}.",
    "Market conditions favorable. {asset} showing bullish momentum with increasing volume. Cross-chain route optimized for minimal gas costs. Estimated savings: ${savings} vs direct swap.",
    "Analyzing on-chain data reveals accumulation pattern. Smart money inflows up {pct}% in 24h. Executing via {route} to capture best available rate across {chains} chains.",
    "Volatility index is low ({vol}), ideal for large position entry. Order book analysis shows sufficient depth. Recommend splitting into {splits} tranches for optimal execution.",
    "Real-time CoinGecko data confirms price stability. Total addressable liquidity: ${liq}M. Proposed route minimizes bridge fees while ensuring sub-60s settlement.",
];

function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAnalysis(asset: string): string {
    const template = randomChoice(ANALYSIS_TEMPLATES);
    return template
        .replace("{pct}", randomBetween(2, 15).toString())
        .replace("{asset}", asset)
        .replace("{route}", randomChoice(["DEX aggregator", "bridge + swap", "direct pool"]))
        .replace("{savings}", randomBetween(5, 50).toString())
        .replace("{chains}", randomBetween(2, 4).toString())
        .replace("{vol}", (Math.random() * 30 + 10).toFixed(1))
        .replace("{splits}", randomBetween(2, 5).toString())
        .replace("{liq}", randomBetween(5, 200).toString());
}

/**
 * Simulate agents competing for an intent.
 * Returns proposals staggered over time with varying quality.
 */
export function simulateProposals(
    intentId: string,
    inputAmount: number,
    assetName = "RWA Token"
): SimulatedProposal[] {
    // Random subset of agents respond (3 to 5)
    const respondingAgents = [...DEMO_AGENTS]
        .sort(() => Math.random() - 0.5)
        .slice(0, randomBetween(3, 5));

    const baseOutput = inputAmount * (1 - Math.random() * 0.05); // 0-5% fee

    return respondingAgents.map((agent, index) => {
        // Better agents tend to give better rates
        const agentQuality = agent.reputation / 100;
        const outputVariation = 1 - (Math.random() * 0.03 * (1 - agentQuality));
        const expectedOutput = Math.floor(baseOutput * outputVariation * 100) / 100;

        return {
            id: generateId(),
            intentId,
            agent,
            expectedOutput,
            estimatedTime: randomBetween(15, 90),
            confidence: randomBetween(70, 98),
            route: randomChoice(ROUTES),
            gasEstimate: Math.random() * 2 + 0.5,
            submittedAt: Date.now() + index * randomBetween(1000, 4000),
            analysis: generateAnalysis(assetName),
        };
    });
}

/**
 * Generate a stream of agent activities for the Submolt feed.
 */
export function generateActivityFeed(count = 20): SimulatedActivity[] {
    const activities: SimulatedActivity[] = [];
    const now = Date.now();

    const actionTemplates = {
        discovery: [
            "discovered a new RWA opportunity in tokenized treasuries",
            "identified price discrepancy on USDY across 3 chains",
            "found optimal bridge route for cross-chain settlement",
            "detected accumulation pattern in PAX Gold markets",
            "flagged high-yield opportunity in tokenized real estate",
        ],
        proposal: [
            "submitted fulfillment proposal for $1,250 treasury intent",
            "proposed cross-chain execution via Across Protocol",
            "offered competitive rate for USDC to tokenized gold swap",
            "submitted optimized multi-hop route for RWA purchase",
            "proposed 28-second fulfillment for Treasury Bond intent",
        ],
        fulfillment: [
            "successfully fulfilled intent #0x7a3b in 24 seconds",
            "completed cross-chain transfer to Arbitrum",
            "delivered 1,050 USDY tokens to user wallet",
            "settled tokenized gold purchase on Ethereum mainnet",
            "fulfilled real estate token purchase via DEX aggregation",
        ],
        analysis: [
            "published market analysis: RWA sector up 12% this week",
            "updated CoinGecko price feed for treasury tokens",
            "generated risk assessment for new tokenized asset listing",
            "analyzed on-chain flows for top 10 RWA protocols",
            "submitted oracle price update for 15 RWA tokens",
        ],
    };

    for (let i = 0; i < count; i++) {
        const agent = randomChoice(DEMO_AGENTS);
        const type = randomChoice(["discovery", "proposal", "fulfillment", "analysis"] as const);
        const actions = actionTemplates[type];

        activities.push({
            id: generateId(),
            agent,
            type,
            action: randomChoice(actions),
            confidence: type === "proposal" ? randomBetween(75, 98) : undefined,
            expectedOutput: type === "proposal" ? randomBetween(500, 10000) : undefined,
            timestamp: now - i * randomBetween(30000, 300000), // staggered over past few hours
        });
    }

    return activities.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Generate demo stats for the landing page.
 */
export function getDemoStats() {
    return {
        totalIntents: 2847,
        totalVolume: 12_500_000,
        activeAgents: DEMO_AGENTS.length,
        avgFulfillmentTime: 34,
        successRate: 94.2,
        totalRWAsTracked: 156,
    };
}
