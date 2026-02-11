import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, formatUnits } from "viem";
import { baseSepolia } from "viem/chains";

// ── Contract config (inlined - cannot import web3.ts, it has client-only RainbowKit) ──

const CONTRACTS = {
    intentRouter: (process.env.NEXT_PUBLIC_INTENT_ROUTER_ADDRESS ||
        "0x0000000000000000000000000000000000000000") as `0x${string}`,
    agentRegistry: (process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS ||
        "0x0000000000000000000000000000000000000000") as `0x${string}`,
    mockUsdc: (process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS ||
        "0x0000000000000000000000000000000000000000") as `0x${string}`,
};

// Minimal read-only ABI (only the view functions the cron needs)
const INTENT_ROUTER_READ_ABI = [
    {
        type: "function",
        name: "getIntentCount",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getPendingIntents",
        inputs: [
            { name: "offset", type: "uint256" },
            { name: "limit", type: "uint256" },
        ],
        outputs: [{ name: "result", type: "bytes32[]" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getIntent",
        inputs: [{ name: "_intentId", type: "bytes32" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "intentId", type: "bytes32" },
                    { name: "user", type: "address" },
                    { name: "inputToken", type: "address" },
                    { name: "inputAmount", type: "uint256" },
                    { name: "destinationChainId", type: "uint32" },
                    { name: "outputToken", type: "address" },
                    { name: "minOutputAmount", type: "uint256" },
                    { name: "deadline", type: "uint256" },
                    { name: "status", type: "uint8" },
                    { name: "assignedAgent", type: "address" },
                    { name: "createdAt", type: "uint256" },
                ],
            },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getProposals",
        inputs: [{ name: "_intentId", type: "bytes32" }],
        outputs: [
            {
                name: "",
                type: "tuple[]",
                components: [
                    { name: "intentId", type: "bytes32" },
                    { name: "agent", type: "address" },
                    { name: "expectedOutput", type: "uint256" },
                    { name: "estimatedTime", type: "uint256" },
                    { name: "confidence", type: "uint256" },
                    { name: "route", type: "string" },
                    { name: "submittedAt", type: "uint256" },
                ],
            },
        ],
        stateMutability: "view",
    },
] as const;

// ── Types ───────────────────────────────────────────────────────────

interface IntentData {
    intentId: string;
    user: string;
    inputToken: string;
    inputAmount: bigint;
    destinationChainId: number;
    outputToken: string;
    minOutputAmount: bigint;
    deadline: bigint;
    status: number;
    assignedAgent: string;
    createdAt: bigint;
}

interface CronResult {
    scanned: number;
    pendingFound: number;
    proposalsGenerated: number;
    intents: Array<{
        id: string;
        user: string;
        amount: string;
        status: string;
        proposalCount: number;
    }>;
    errors: string[];
    mode: "on-chain" | "simulation";
    timestamp: number;
}

// ── Constants ───────────────────────────────────────────────────────

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const STATUS_NAMES = [
    "Pending",
    "Active",
    "Assigned",
    "Fulfilled",
    "Cancelled",
    "Expired",
    "Failed",
];

const SCAN_BATCH_SIZE = 50;

const contractsDeployed =
    CONTRACTS.intentRouter !== ZERO_ADDRESS &&
    CONTRACTS.agentRegistry !== ZERO_ADDRESS;

// ── Viem public client (read-only, no wallet needed) ────────────────

const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http("https://sepolia.base.org"),
});

// ── Simulated agent proposal generator ──────────────────────────────

function generateSimulatedProposal(intentId: string, inputAmount: string) {
    const agents = [
        { name: "TreasuryHawk", specialization: "Treasury bonds", confidence: 94 },
        { name: "GoldDigger", specialization: "Tokenized gold", confidence: 91 },
        {
            name: "CrossChainNinja",
            specialization: "Cross-chain bridges",
            confidence: 88,
        },
        { name: "YieldYak", specialization: "Yield optimization", confidence: 92 },
        {
            name: "RealEstateBot",
            specialization: "Tokenized real estate",
            confidence: 87,
        },
    ];

    const amount = parseFloat(inputAmount);
    const selectedAgents = agents
        .sort(() => Math.random() - 0.5)
        .slice(0, 2 + Math.floor(Math.random() * 3));

    return selectedAgents.map((agent) => ({
        intentId,
        agent: agent.name,
        expectedOutput: (amount * (0.97 + Math.random() * 0.04)).toFixed(2),
        estimatedTime: Math.floor(15 + Math.random() * 45),
        confidence: agent.confidence - Math.floor(Math.random() * 5),
        route: `${agent.specialization} via optimized ${Math.random() > 0.5 ? "DEX aggregation" : "direct settlement"
            }`,
    }));
}

// ── Main cron handler ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
    // ── Auth check ──────────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
            { error: "Unauthorized. Provide Authorization: Bearer <CRON_SECRET>" },
            { status: 401 }
        );
    }

    const result: CronResult = {
        scanned: 0,
        pendingFound: 0,
        proposalsGenerated: 0,
        intents: [],
        errors: [],
        mode: contractsDeployed ? "on-chain" : "simulation",
        timestamp: Date.now(),
    };

    try {
        if (contractsDeployed) {
            // ── On-chain mode: scan the IntentRouter contract ───────────

            // 1. Get total intent count
            const intentCount = (await publicClient.readContract({
                address: CONTRACTS.intentRouter,
                abi: INTENT_ROUTER_READ_ABI,
                functionName: "getIntentCount",
            })) as bigint;

            result.scanned = Number(intentCount);

            if (intentCount === BigInt(0)) {
                return NextResponse.json({
                    ...result,
                    message: "No intents found on-chain",
                });
            }

            // 2. Scan for pending/active intents in batches
            const totalBatches = Math.ceil(Number(intentCount) / SCAN_BATCH_SIZE);
            const allPendingIds: string[] = [];

            for (let batch = 0; batch < totalBatches; batch++) {
                try {
                    const pendingIds = (await publicClient.readContract({
                        address: CONTRACTS.intentRouter,
                        abi: INTENT_ROUTER_READ_ABI,
                        functionName: "getPendingIntents",
                        args: [
                            BigInt(batch * SCAN_BATCH_SIZE),
                            BigInt(SCAN_BATCH_SIZE),
                        ],
                    })) as readonly `0x${string}`[];

                    for (const id of pendingIds) {
                        if (id !== ("0x" + "0".repeat(64))) {
                            allPendingIds.push(id);
                        }
                    }
                } catch (err) {
                    result.errors.push(
                        `Batch ${batch} scan failed: ${(err as Error).message.slice(0, 80)}`
                    );
                }
            }

            result.pendingFound = allPendingIds.length;

            // 3. For each pending intent, read details and generate proposals
            for (const intentId of allPendingIds) {
                try {
                    const intentData = (await publicClient.readContract({
                        address: CONTRACTS.intentRouter,
                        abi: INTENT_ROUTER_READ_ABI,
                        functionName: "getIntent",
                        args: [intentId as `0x${string}`],
                    })) as IntentData;

                    const amountFormatted = formatUnits(intentData.inputAmount, 6);

                    // Check existing on-chain proposals
                    const existingProposals = (await publicClient.readContract({
                        address: CONTRACTS.intentRouter,
                        abi: INTENT_ROUTER_READ_ABI,
                        functionName: "getProposals",
                        args: [intentId as `0x${string}`],
                    })) as readonly unknown[];

                    // Generate simulated proposals for display
                    const proposals = generateSimulatedProposal(
                        intentId,
                        amountFormatted
                    );

                    result.intents.push({
                        id: intentId.slice(0, 18) + "...",
                        user: intentData.user.slice(0, 10) + "...",
                        amount: `$${parseFloat(amountFormatted).toLocaleString()} USDC`,
                        status: STATUS_NAMES[intentData.status] || "Unknown",
                        proposalCount: existingProposals.length + proposals.length,
                    });

                    result.proposalsGenerated += proposals.length;
                } catch (err) {
                    result.errors.push(
                        `Intent ${intentId.slice(0, 10)} read failed: ${(err as Error).message.slice(0, 80)}`
                    );
                }
            }
        } else {
            // ── Simulation mode: generate demo data ─────────────────────
            const demoIntents = [
                { id: "0xdemo_001", amount: "1000", user: "0xUser1" },
                { id: "0xdemo_002", amount: "5000", user: "0xUser2" },
                { id: "0xdemo_003", amount: "250", user: "0xUser3" },
            ];

            result.scanned = demoIntents.length;
            result.pendingFound = demoIntents.length;

            for (const demo of demoIntents) {
                const proposals = generateSimulatedProposal(demo.id, demo.amount);
                result.intents.push({
                    id: demo.id,
                    user: demo.user,
                    amount: `$${parseFloat(demo.amount).toLocaleString()} USDC`,
                    status: "Pending",
                    proposalCount: proposals.length,
                });
                result.proposalsGenerated += proposals.length;
            }
        }
    } catch (err) {
        result.errors.push(
            `Cron execution error: ${(err as Error).message.slice(0, 120)}`
        );
    }

    const summary = [
        `[Agoge Cron] Mode: ${result.mode}`,
        `Scanned: ${result.scanned} intents`,
        `Pending: ${result.pendingFound}`,
        `Proposals generated: ${result.proposalsGenerated}`,
        result.errors.length > 0 ? `Errors: ${result.errors.length}` : null,
    ]
        .filter(Boolean)
        .join(" | ");

    console.log(summary);

    return NextResponse.json(result);
}
