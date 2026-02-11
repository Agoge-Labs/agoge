"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    BarChart3,
    Clock,
    Zap,
    TrendingUp,
    CheckCircle,
    XCircle,
    Loader2,
    ArrowRight,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { formatCurrency } from "@/lib/utils";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const STATUS_CONFIG = {
    pending: { label: "Pending", color: "var(--accent-amber)", icon: Clock },
    competing: { label: "Agents Competing", color: "var(--accent-blue)", icon: Loader2 },
    assigned: { label: "Assigned", color: "var(--accent-purple)", icon: Zap },
    fulfilled: { label: "Fulfilled", color: "var(--accent-green)", icon: CheckCircle },
    cancelled: { label: "Cancelled", color: "var(--text-muted)", icon: XCircle },
    failed: { label: "Failed", color: "var(--accent-rose)", icon: XCircle },
};

export default function PortfolioPage() {
    const { intents } = useAppStore();
    const { isConnected } = useAccount();

    const fulfilledIntents = intents.filter((i) => i.status === "fulfilled");
    const totalValue = fulfilledIntents.reduce((s, i) => s + i.inputAmount, 0);

    if (!isConnected) {
        return (
            <div className="container" style={{ padding: "80px 16px", textAlign: "center" }}>
                <BarChart3 size={48} style={{ color: "var(--text-muted)", marginBottom: 16 }} />
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Your Portfolio</h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
                    Connect your wallet to view your intent history and portfolio.
                </p>
                <ConnectButton />
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: "40px 16px 80px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
                    <BarChart3 size={28} style={{ verticalAlign: "middle", marginRight: 8, color: "var(--accent-blue)" }} />
                    Your Portfolio
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 32 }}>
                    Track your intent history and fulfilled transactions.
                </p>
            </motion.div>

            {/* Summary Cards */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                marginBottom: 32,
            }}>
                <div className="glass-card-static" style={{ padding: 20 }}>
                    <TrendingUp size={20} style={{ color: "var(--accent-green)", marginBottom: 8 }} />
                    <div style={{ fontSize: 28, fontWeight: 800 }}>{formatCurrency(totalValue)}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Total Invested</div>
                </div>
                <div className="glass-card-static" style={{ padding: 20 }}>
                    <Zap size={20} style={{ color: "var(--accent-blue)", marginBottom: 8 }} />
                    <div style={{ fontSize: 28, fontWeight: 800 }}>{intents.length}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Total Intents</div>
                </div>
                <div className="glass-card-static" style={{ padding: 20 }}>
                    <CheckCircle size={20} style={{ color: "var(--accent-green)", marginBottom: 8 }} />
                    <div style={{ fontSize: 28, fontWeight: 800 }}>{fulfilledIntents.length}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Fulfilled</div>
                </div>
            </div>

            {/* Intent History */}
            {intents.length === 0 ? (
                <div className="glass-card-static" style={{ textAlign: "center", padding: 60 }}>
                    <Zap size={48} style={{ color: "var(--text-muted)", marginBottom: 16 }} />
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Intents Yet</h3>
                    <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
                        Create your first RWA purchase intent to get started.
                    </p>
                    <Link href="/intents/new">
                        <button className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            Create Intent <ArrowRight size={14} />
                        </button>
                    </Link>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {intents.map((intent, i) => {
                        const statusConfig = STATUS_CONFIG[intent.status];
                        const StatusIcon = statusConfig.icon;
                        return (
                            <motion.div
                                key={intent.id}
                                className="glass-card-static"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                style={{ padding: 20 }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                            <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                                                {intent.outputTokenName || intent.outputToken}
                                            </h3>
                                            <span
                                                className={`badge`}
                                                style={{
                                                    background: `${statusConfig.color}15`,
                                                    color: statusConfig.color,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                }}
                                            >
                                                <StatusIcon size={10} />
                                                {statusConfig.label}
                                            </span>
                                        </div>
                                        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                                            {formatCurrency(intent.inputAmount)} USDC on {intent.destinationChain}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                                            {new Date(intent.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {intent.selectedProposal && (
                                    <div style={{
                                        marginTop: 12,
                                        paddingTop: 12,
                                        borderTop: "1px solid var(--border-default)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        fontSize: 13,
                                        color: "var(--text-secondary)",
                                    }}>
                                        <span style={{ fontSize: 18 }}>{intent.selectedProposal.agent.avatar}</span>
                                        Fulfilled by <strong>{intent.selectedProposal.agent.name}</strong> in {intent.selectedProposal.estimatedTime}s
                                        | Output: <strong style={{ color: "var(--accent-green)" }}>{formatCurrency(intent.selectedProposal.expectedOutput)}</strong>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
