"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
    Zap,
    ChevronRight,
    Check,
    ArrowRight,
    Clock,
    Shield,
    AlertTriangle,
    Loader2,
    Wallet,
    ExternalLink,
    LinkIcon,
} from "lucide-react";
import { formatCurrency, generateId } from "@/lib/utils";
import { simulateProposals, type SimulatedProposal } from "@/lib/agents/agent-simulator";
import { useAppStore } from "@/store/app-store";
import {
    CONTRACTS,
    INTENT_ROUTER_ABI,
    MOCK_USDC_ABI,
} from "@/lib/web3";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

const CHAINS = [
    { id: 84532, name: "Base Sepolia", color: "#0052FF" },
    { id: 421614, name: "Arbitrum Sepolia", color: "#12AAFF" },
    { id: 11155111, name: "Ethereum Sepolia", color: "#627EEA" },
];

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

// Check if contracts are actually deployed (non-zero address in env)
const contractsDeployed =
    CONTRACTS.intentRouter !== ZERO_ADDRESS &&
    CONTRACTS.mockUsdc !== ZERO_ADDRESS;

function IntentFormContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const { addIntent } = useAppStore();

    // Form state
    const [step, setStep] = useState(1);
    const [assetName, setAssetName] = useState(searchParams.get("name") || "");
    const [assetSymbol, setAssetSymbol] = useState(searchParams.get("symbol") || "");
    const [assetId, setAssetId] = useState(searchParams.get("asset") || "");
    const [amount, setAmount] = useState("");
    const [destinationChain, setDestinationChain] = useState(CHAINS[0].id);

    // On-chain transaction state
    const [txPhase, setTxPhase] = useState<
        "idle" | "approving" | "submitting" | "confirmed" | "error"
    >("idle");
    const [txError, setTxError] = useState<string | null>(null);
    const [onChainIntentId, setOnChainIntentId] = useState<string | null>(null);

    // Agent competition state (simulator - runs after on-chain tx)
    const [proposals, setProposals] = useState<SimulatedProposal[]>([]);
    const [loadingProposals, setLoadingProposals] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<SimulatedProposal | null>(null);

    const amountNum = parseFloat(amount) || 0;
    const isValidAmount = amountNum >= 100 && amountNum <= 10000;
    // MockUSDC has 6 decimals like real USDC
    const amountInWei = isValidAmount ? parseUnits(amount, 6) : BigInt(0);

    // --- Wagmi: Read USDC balance ---
    const { data: usdcBalance } = useReadContract({
        address: CONTRACTS.mockUsdc,
        abi: MOCK_USDC_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        query: { enabled: contractsDeployed && !!address },
    });

    // --- Wagmi: Read current allowance ---
    const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
        address: CONTRACTS.mockUsdc,
        abi: MOCK_USDC_ABI,
        functionName: "allowance",
        args: address ? [address, CONTRACTS.intentRouter] : undefined,
        query: { enabled: contractsDeployed && !!address },
    });

    // --- Wagmi: Approve USDC ---
    const {
        writeContract: writeApprove,
        data: approveHash,
        isPending: isApprovePending,
        error: approveError,
        reset: resetApprove,
    } = useWriteContract();

    const { isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
        hash: approveHash,
    });

    // --- Wagmi: Submit Intent ---
    const {
        writeContract: writeSubmitIntent,
        data: submitHash,
        isPending: isSubmitPending,
        error: submitError,
        reset: resetSubmit,
    } = useWriteContract();

    const { isSuccess: isSubmitConfirmed } = useWaitForTransactionReceipt({
        hash: submitHash,
    });

    // After approval is confirmed, proceed to submit
    useEffect(() => {
        if (isApproveConfirmed && txPhase === "approving") {
            refetchAllowance();
            setTxPhase("submitting");

            const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400); // 24h
            writeSubmitIntent({
                address: CONTRACTS.intentRouter,
                abi: INTENT_ROUTER_ABI,
                functionName: "submitIntent",
                args: [
                    CONTRACTS.mockUsdc,       // inputToken
                    amountInWei,              // inputAmount
                    destinationChain,         // destinationChainId
                    CONTRACTS.mockUsdc,       // outputToken (placeholder - same token for demo)
                    amountInWei * BigInt(95) / BigInt(100), // minOutputAmount (5% slippage)
                    deadline,
                ],
            });
        }
    }, [isApproveConfirmed]);

    // After intent submission is confirmed, move to agent competition
    useEffect(() => {
        if (isSubmitConfirmed && txPhase === "submitting") {
            setTxPhase("confirmed");
            setOnChainIntentId(submitHash || null);
            // Now start the simulated agent competition
            startAgentCompetition();
        }
    }, [isSubmitConfirmed]);

    // Track errors
    useEffect(() => {
        const error = approveError || submitError;
        if (error && txPhase !== "idle") {
            setTxPhase("error");
            const msg = (error as Error).message || "Transaction failed";
            // Extract short reason from the error
            setTxError(msg.includes("User rejected") ? "Transaction rejected by user" : msg.slice(0, 120));
        }
    }, [approveError, submitError]);

    // --- Start agent competition (visual simulation) ---
    const startAgentCompetition = async () => {
        setStep(3);
        setLoadingProposals(true);

        const newProposals = simulateProposals(
            generateId(),
            amountNum,
            assetName || "RWA Token"
        );

        for (let i = 0; i < newProposals.length; i++) {
            await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
            setProposals((prev) => [...prev, newProposals[i]]);
        }

        setLoadingProposals(false);
    };

    // --- Main submit handler ---
    const handleSubmitIntent = async () => {
        if (!isValidAmount || !assetId) return;

        if (contractsDeployed && isConnected) {
            // Real on-chain flow: approve -> submit -> then simulate agent competition
            setTxPhase("approving");
            setTxError(null);
            resetApprove();
            resetSubmit();
            setStep(2.5 as any); // Show tx progress UI

            // Check if already approved
            const needsApproval = !currentAllowance || (currentAllowance as bigint) < amountInWei;

            if (needsApproval) {
                writeApprove({
                    address: CONTRACTS.mockUsdc,
                    abi: MOCK_USDC_ABI,
                    functionName: "approve",
                    args: [CONTRACTS.intentRouter, amountInWei],
                });
            } else {
                // Already approved, skip to submit
                setTxPhase("submitting");
                const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);
                writeSubmitIntent({
                    address: CONTRACTS.intentRouter,
                    abi: INTENT_ROUTER_ABI,
                    functionName: "submitIntent",
                    args: [
                        CONTRACTS.mockUsdc,
                        amountInWei,
                        destinationChain,
                        CONTRACTS.mockUsdc,
                        amountInWei * BigInt(95) / BigInt(100),
                        deadline,
                    ],
                });
            }
        } else {
            // Simulation-only mode (contracts not deployed)
            startAgentCompetition();
        }
    };

    const handleSelectProposal = (proposal: SimulatedProposal) => {
        setSelectedProposal(proposal);
        setStep(4);

        setTimeout(() => {
            setStep(5);
            addIntent({
                id: onChainIntentId || generateId(),
                inputToken: "USDC",
                inputAmount: amountNum,
                outputToken: assetId,
                outputTokenName: assetName,
                destinationChain: CHAINS.find((c) => c.id === destinationChain)?.name || "Base",
                status: "fulfilled",
                proposals: proposals,
                selectedProposal: proposal,
                createdAt: Date.now(),
            });
        }, 3000);
    };

    const resetForm = () => {
        setStep(1);
        setProposals([]);
        setSelectedProposal(null);
        setTxPhase("idle");
        setTxError(null);
        setOnChainIntentId(null);
        resetApprove();
        resetSubmit();
    };

    const STEPS = ["Select Asset", "Set Amount", "Agents Compete", "Select Proposal", "Complete"];

    const formattedBalance = usdcBalance
        ? parseFloat(formatUnits(usdcBalance as bigint, 6)).toLocaleString(undefined, { maximumFractionDigits: 2 })
        : null;

    return (
        <div className="container" style={{ padding: "40px 16px 80px", maxWidth: 720, margin: "0 auto" }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 32 }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                        <Zap size={24} style={{ verticalAlign: "middle", marginRight: 8, color: "var(--accent-blue)" }} />
                        Create New Intent
                    </h1>
                    {contractsDeployed ? (
                        <span className="badge badge-green" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                            <LinkIcon size={10} /> On-Chain
                        </span>
                    ) : (
                        <span className="badge badge-amber" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                            Simulation Mode
                        </span>
                    )}
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                    Express your RWA purchase intent and let AI agents compete for the best execution.
                </p>
            </motion.div>

            {/* Progress Bar */}
            <div className="progress-steps" style={{ marginBottom: 40 }}>
                {STEPS.map((label, i) => (
                    <div
                        key={label}
                        className={`progress-step ${Math.floor(step as number) === i + 1 ? "active" : ""} ${i + 1 < Math.floor(step as number) ? "completed" : ""}`}
                    >
                        <div className="progress-step-dot">
                            {i + 1 < Math.floor(step as number) ? <Check size={14} /> : i + 1}
                        </div>
                        <span className="progress-step-label">{label}</span>
                    </div>
                ))}
            </div>

            {/* Wallet Check */}
            {!isConnected && (
                <div className="glass-card-static" style={{ textAlign: "center", padding: 40, marginBottom: 24 }}>
                    <AlertTriangle size={32} style={{ color: "var(--accent-amber)", marginBottom: 12 }} />
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Connect Your Wallet</h3>
                    <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
                        You need a connected wallet to submit intents on-chain.
                    </p>
                    <ConnectButton />
                </div>
            )}

            {/* Step 1 & 2: Intent Form */}
            {step <= 2 && (
                <motion.div className="glass-card-static" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* USDC Balance */}
                    {contractsDeployed && isConnected && formattedBalance !== null && (
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "10px 14px", borderRadius: 8,
                            background: "rgba(59, 130, 246, 0.05)",
                            border: "1px solid rgba(59, 130, 246, 0.1)",
                            marginBottom: 20, fontSize: 13,
                        }}>
                            <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                                <Wallet size={14} /> MockUSDC Balance
                            </span>
                            <span style={{ fontWeight: 700 }}>${formattedBalance}</span>
                        </div>
                    )}

                    {/* Asset Selection */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
                            Target Asset
                        </label>
                        {assetId ? (
                            <div style={{
                                padding: "12px 16px",
                                border: "1px solid var(--accent-green)", borderRadius: 10,
                                background: "rgba(16, 185, 129, 0.05)",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                            }}>
                                <div>
                                    <span style={{ fontWeight: 700 }}>{assetName}</span>
                                    <span style={{ color: "var(--text-muted)", marginLeft: 8, textTransform: "uppercase" }}>{assetSymbol}</span>
                                </div>
                                <button className="btn-ghost" onClick={() => router.push("/discover")} style={{ fontSize: 12 }}>
                                    Change
                                </button>
                            </div>
                        ) : (
                            <button
                                className="btn-secondary"
                                onClick={() => router.push("/discover")}
                                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                            >
                                Browse Assets on Discover Page
                                <ChevronRight size={14} />
                            </button>
                        )}
                    </div>

                    {/* Amount */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
                            Amount (USDC)
                        </label>
                        <div style={{
                            display: "flex", alignItems: "center",
                            border: `1px solid ${amount && !isValidAmount ? "var(--accent-rose)" : "var(--border-default)"}`,
                            borderRadius: 10, padding: "0 16px",
                            background: "rgba(255, 255, 255, 0.02)",
                        }}>
                            <span style={{ color: "var(--text-muted)", fontSize: 18, fontWeight: 700, marginRight: 4 }}>$</span>
                            <input
                                type="number"
                                placeholder="1,000"
                                value={amount}
                                onChange={(e) => { setAmount(e.target.value); setStep(2); }}
                                min={100} max={10000}
                                style={{
                                    background: "transparent", border: "none", outline: "none",
                                    color: "var(--text-primary)", fontSize: 18, fontWeight: 700,
                                    padding: "14px 0", width: "100%",
                                }}
                            />
                        </div>
                        {amount && !isValidAmount && (
                            <p style={{ color: "var(--accent-rose)", fontSize: 12, marginTop: 6 }}>
                                Amount must be between $100 and $10,000
                            </p>
                        )}

                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            {QUICK_AMOUNTS.map((qa) => (
                                <button
                                    key={qa}
                                    onClick={() => { setAmount(qa.toString()); setStep(2); }}
                                    style={{
                                        padding: "6px 14px", borderRadius: 8,
                                        border: "1px solid var(--border-default)",
                                        background: amount === qa.toString() ? "rgba(59, 130, 246, 0.1)" : "transparent",
                                        color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", fontWeight: 500,
                                    }}
                                >
                                    ${qa.toLocaleString()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Destination Chain */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
                            Settlement Chain
                        </label>
                        <div style={{ display: "flex", gap: 8 }}>
                            {CHAINS.map((chain) => (
                                <button
                                    key={chain.id}
                                    onClick={() => setDestinationChain(chain.id)}
                                    style={{
                                        flex: 1, padding: "12px", borderRadius: 10,
                                        border: `1px solid ${destinationChain === chain.id ? chain.color : "var(--border-default)"}`,
                                        background: destinationChain === chain.id ? `${chain.color}10` : "transparent",
                                        color: destinationChain === chain.id ? chain.color : "var(--text-secondary)",
                                        fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s ease",
                                    }}
                                >
                                    {chain.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        className="btn-primary"
                        disabled={!isValidAmount || !assetId || !isConnected}
                        onClick={handleSubmitIntent}
                        style={{
                            width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                            gap: 8, fontSize: 16, padding: 16,
                        }}
                    >
                        {contractsDeployed ? "Submit Intent On-Chain" : "Submit Intent (Demo)"}
                        <ArrowRight size={18} />
                    </button>
                </motion.div>
            )}

            {/* On-Chain Transaction Progress */}
            {txPhase !== "idle" && step < 3 && (
                <motion.div
                    className="glass-card-static"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: 16 }}
                >
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>On-Chain Transaction</h3>

                    {/* Step 1: Approve */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: txPhase === "approving"
                                ? "rgba(59, 130, 246, 0.15)"
                                : isApproveConfirmed || txPhase === "submitting" || txPhase === "confirmed"
                                    ? "rgba(16, 185, 129, 0.15)"
                                    : "rgba(255, 255, 255, 0.05)",
                        }}>
                            {txPhase === "approving" && !isApproveConfirmed ? (
                                <Loader2 size={16} style={{ color: "var(--accent-blue)", animation: "spin 1s linear infinite" }} />
                            ) : isApproveConfirmed || txPhase === "submitting" || txPhase === "confirmed" ? (
                                <Check size={16} style={{ color: "var(--accent-green)" }} />
                            ) : (
                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>1</span>
                            )}
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>Approve USDC</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                {txPhase === "approving" && !isApproveConfirmed
                                    ? "Waiting for wallet confirmation..."
                                    : isApproveConfirmed || txPhase === "submitting" || txPhase === "confirmed"
                                        ? "Approved"
                                        : "Pending"}
                            </div>
                        </div>
                        {approveHash && (
                            <a
                                href={`https://sepolia.basescan.org/tx/${approveHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ marginLeft: "auto", color: "var(--accent-blue)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                            >
                                <ExternalLink size={12} /> Basescan
                            </a>
                        )}
                    </div>

                    {/* Step 2: Submit Intent */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: txPhase === "submitting"
                                ? "rgba(59, 130, 246, 0.15)"
                                : txPhase === "confirmed"
                                    ? "rgba(16, 185, 129, 0.15)"
                                    : "rgba(255, 255, 255, 0.05)",
                        }}>
                            {txPhase === "submitting" && !isSubmitConfirmed ? (
                                <Loader2 size={16} style={{ color: "var(--accent-blue)", animation: "spin 1s linear infinite" }} />
                            ) : txPhase === "confirmed" ? (
                                <Check size={16} style={{ color: "var(--accent-green)" }} />
                            ) : (
                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>2</span>
                            )}
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>Submit Intent</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                {txPhase === "submitting" && !isSubmitConfirmed
                                    ? "Broadcasting to Base Sepolia..."
                                    : txPhase === "confirmed"
                                        ? "Intent recorded on-chain"
                                        : "Waiting for approval"}
                            </div>
                        </div>
                        {submitHash && (
                            <a
                                href={`https://sepolia.basescan.org/tx/${submitHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ marginLeft: "auto", color: "var(--accent-blue)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                            >
                                <ExternalLink size={12} /> Basescan
                            </a>
                        )}
                    </div>

                    {/* Error State */}
                    {txPhase === "error" && (
                        <div style={{
                            marginTop: 16, padding: "12px 16px", borderRadius: 8,
                            background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)",
                        }}>
                            <div style={{ fontSize: 13, color: "var(--accent-rose)", fontWeight: 600, marginBottom: 4 }}>
                                Transaction Failed
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", wordBreak: "break-word" }}>
                                {txError}
                            </div>
                            <button
                                className="btn-secondary"
                                onClick={resetForm}
                                style={{ marginTop: 10, fontSize: 12 }}
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Step 3+: Agent Competition */}
            {step >= 3 && step < 5 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {/* On-chain confirmation banner */}
                    {onChainIntentId && (
                        <div style={{
                            padding: "10px 14px", borderRadius: 8, marginBottom: 12,
                            background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.15)",
                            display: "flex", alignItems: "center", gap: 8, fontSize: 12,
                        }}>
                            <Check size={14} style={{ color: "var(--accent-green)" }} />
                            <span style={{ color: "var(--accent-green)", fontWeight: 600 }}>On-chain intent confirmed</span>
                            <a
                                href={`https://sepolia.basescan.org/tx/${onChainIntentId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ marginLeft: "auto", color: "var(--accent-blue)", display: "flex", alignItems: "center", gap: 4 }}
                            >
                                <ExternalLink size={10} /> View
                            </a>
                        </div>
                    )}

                    <div className="glass-card-static" style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            {loadingProposals ? (
                                <Loader2 size={18} style={{ color: "var(--accent-blue)", animation: "spin 1s linear infinite" }} />
                            ) : (
                                <Check size={18} style={{ color: "var(--accent-green)" }} />
                            )}
                            <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                                {loadingProposals
                                    ? "Agents are analyzing your intent..."
                                    : `${proposals.length} agents submitted proposals`}
                            </h3>
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                            Buying {formatCurrency(amountNum)} of {assetName || "RWA Token"} on {CHAINS.find((c) => c.id === destinationChain)?.name}
                        </p>
                    </div>

                    {/* Proposals */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <AnimatePresence>
                            {proposals.map((proposal) => (
                                <motion.div
                                    key={proposal.id}
                                    className="glass-card"
                                    initial={{ opacity: 0, x: -30, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    onClick={() => !selectedProposal && handleSelectProposal(proposal)}
                                    style={{
                                        cursor: selectedProposal ? "default" : "pointer",
                                        border: selectedProposal?.id === proposal.id ? "1px solid var(--accent-green)" : undefined,
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 10,
                                                background: "rgba(59, 130, 246, 0.1)",
                                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                                            }}>
                                                {proposal.agent.avatar}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 14 }}>{proposal.agent.name}</div>
                                                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                                    Rep: {proposal.agent.reputation} | {proposal.agent.successRate}% success
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent-green)" }}>
                                                {formatCurrency(proposal.expectedOutput)}
                                            </div>
                                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>expected output</div>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
                                        marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-default)", fontSize: 12,
                                    }}>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)" }}>
                                                <Clock size={10} /> Est. Time
                                            </div>
                                            <div style={{ fontWeight: 600, marginTop: 2 }}>{proposal.estimatedTime}s</div>
                                        </div>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)" }}>
                                                <Shield size={10} /> Confidence
                                            </div>
                                            <div style={{ fontWeight: 600, marginTop: 2, color: proposal.confidence >= 90 ? "var(--accent-green)" : "var(--accent-amber)" }}>
                                                {proposal.confidence}%
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)" }}>
                                                <Zap size={10} /> Gas
                                            </div>
                                            <div style={{ fontWeight: 600, marginTop: 2 }}>${proposal.gasEstimate.toFixed(2)}</div>
                                        </div>
                                    </div>

                                    <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 10, lineHeight: 1.5, fontStyle: "italic" }}>
                                        {proposal.analysis}
                                    </p>

                                    {!selectedProposal && (
                                        <button className="btn-primary" style={{ width: "100%", marginTop: 12, padding: "10px", fontSize: 13 }}>
                                            Select This Proposal
                                        </button>
                                    )}

                                    {selectedProposal?.id === proposal.id && (
                                        <div style={{
                                            marginTop: 12, padding: "10px 16px", borderRadius: 8,
                                            background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)",
                                            display: "flex", alignItems: "center", gap: 8,
                                            fontSize: 13, color: "var(--accent-green)", fontWeight: 600,
                                        }}>
                                            <Check size={14} />
                                            Selected - Executing...
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}

            {/* Step 5: Complete */}
            {step === 5 && (
                <motion.div
                    className="glass-card-static"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: "center", padding: 48 }}
                >
                    <div style={{
                        width: 64, height: 64, borderRadius: "50%",
                        background: "rgba(16, 185, 129, 0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 16px",
                    }}>
                        <Check size={32} style={{ color: "var(--accent-green)" }} />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Intent Fulfilled!</h2>
                    <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
                        {selectedProposal?.agent.name} successfully executed your intent.
                        {" "}{formatCurrency(selectedProposal?.expectedOutput || 0)} of {assetName} delivered.
                    </p>

                    {onChainIntentId && (
                        <a
                            href={`https://sepolia.basescan.org/tx/${onChainIntentId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                color: "var(--accent-blue)", fontSize: 13, marginBottom: 20,
                            }}
                        >
                            <ExternalLink size={14} /> View on Basescan
                        </a>
                    )}

                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                        <button className="btn-primary" onClick={() => router.push("/portfolio")}>
                            View Portfolio
                        </button>
                        <button className="btn-secondary" onClick={resetForm}>
                            Create Another Intent
                        </button>
                    </div>
                </motion.div>
            )}

            <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}

export default function NewIntentPage() {
    return (
        <Suspense fallback={
            <div className="container" style={{ padding: "80px 16px", textAlign: "center" }}>
                <Loader2 size={32} style={{ color: "var(--accent-blue)", animation: "spin 1s linear infinite" }} />
                <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        }>
            <IntentFormContent />
        </Suspense>
    );
}
