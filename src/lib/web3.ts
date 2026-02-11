import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const config = getDefaultConfig({
    appName: "Agoge",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id",
    chains: [baseSepolia],
    transports: {
        [baseSepolia.id]: http("https://sepolia.base.org"),
    },
    ssr: true,
});

// Contract addresses (set after Remix deployment)
export const CONTRACTS = {
    intentRouter: (process.env.NEXT_PUBLIC_INTENT_ROUTER_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    agentRegistry: (process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    reputationManager: (process.env.NEXT_PUBLIC_REPUTATION_MANAGER_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    priceOracle: (process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    mockUsdc: (process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
} as const;

// Minimal ABIs for contract interaction
export const INTENT_ROUTER_ABI = [
    {
        type: "function",
        name: "submitIntent",
        inputs: [
            { name: "_inputToken", type: "address" },
            { name: "_inputAmount", type: "uint256" },
            { name: "_destinationChainId", type: "uint32" },
            { name: "_outputToken", type: "address" },
            { name: "_minOutputAmount", type: "uint256" },
            { name: "_deadline", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bytes32" }],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "cancelIntent",
        inputs: [{ name: "_intentId", type: "bytes32" }],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "selectProposal",
        inputs: [
            { name: "_intentId", type: "bytes32" },
            { name: "_proposalIndex", type: "uint256" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
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
        name: "getUserIntents",
        inputs: [{ name: "_user", type: "address" }],
        outputs: [{ name: "", type: "bytes32[]" }],
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
    {
        type: "function",
        name: "intentCount",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "event",
        name: "IntentSubmitted",
        inputs: [
            { name: "intentId", type: "bytes32", indexed: true },
            { name: "user", type: "address", indexed: true },
            { name: "inputToken", type: "address", indexed: false },
            { name: "inputAmount", type: "uint256", indexed: false },
            { name: "destinationChainId", type: "uint32", indexed: false },
            { name: "outputToken", type: "address", indexed: false },
            { name: "minOutputAmount", type: "uint256", indexed: false },
            { name: "deadline", type: "uint256", indexed: false },
        ],
    },
    {
        type: "event",
        name: "ProposalSubmitted",
        inputs: [
            { name: "intentId", type: "bytes32", indexed: true },
            { name: "agent", type: "address", indexed: true },
            { name: "expectedOutput", type: "uint256", indexed: false },
            { name: "estimatedTime", type: "uint256", indexed: false },
            { name: "confidence", type: "uint256", indexed: false },
        ],
    },
] as const;

export const AGENT_REGISTRY_ABI = [
    {
        type: "function",
        name: "registerAgent",
        inputs: [
            { name: "_name", type: "string" },
            { name: "_specialization", type: "string" },
        ],
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        name: "agents",
        inputs: [{ name: "", type: "address" }],
        outputs: [
            { name: "name", type: "string" },
            { name: "specialization", type: "string" },
            { name: "agentAddress", type: "address" },
            { name: "stake", type: "uint256" },
            { name: "isActive", type: "bool" },
            { name: "registeredAt", type: "uint256" },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "isActiveAgent",
        inputs: [{ name: "_agent", type: "address" }],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getAllAgents",
        outputs: [{ name: "", type: "address[]" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "agentCount",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
] as const;

export const REPUTATION_MANAGER_ABI = [
    {
        type: "function",
        name: "getReputationScore",
        inputs: [{ name: "agent", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "agentStats",
        inputs: [{ name: "", type: "address" }],
        outputs: [
            { name: "totalIntents", type: "uint256" },
            { name: "successfulFulfillments", type: "uint256" },
            { name: "totalExecutionTime", type: "uint256" },
            { name: "stake", type: "uint256" },
            { name: "isActive", type: "bool" },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getFulfillmentRate",
        inputs: [{ name: "agent", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getAvgExecutionTime",
        inputs: [{ name: "agent", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
] as const;

export const MOCK_USDC_ABI = [
    {
        type: "function",
        name: "mint",
        inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "approve",
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "balanceOf",
        inputs: [{ name: "", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "allowance",
        inputs: [
            { name: "", type: "address" },
            { name: "", type: "address" },
        ],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
] as const;
