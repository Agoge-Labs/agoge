"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Trophy,
    Shield,
    Clock,
    TrendingUp,
    Zap,
    Activity,
    Star,
    ChevronDown,
    Bot,
} from "lucide-react";
import { DEMO_AGENTS, generateActivityFeed, type SimulatedAgent, type SimulatedActivity } from "@/lib/agents/agent-simulator";
import { formatCurrency } from "@/lib/utils";

export default function AgentArenaPage() {
    const [agents] = useState<SimulatedAgent[]>(DEMO_AGENTS);
    const [activities, setActivities] = useState<SimulatedActivity[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<SimulatedAgent | null>(null);
    const [view, setView] = useState<"leaderboard" | "activity">("leaderboard");

    useEffect(() => {
        setActivities(generateActivityFeed(20));
        // Auto-refresh feed
        const interval = setInterval(() => {
            setActivities(generateActivityFeed(20));
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const sortedAgents = [...agents].sort((a, b) => b.reputation - a.reputation);

    return (
        <div className="container" style={{ padding: "40px 16px 80px" }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 32 }}
            >
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
                    <span className="gradient-text">Agent Arena</span>
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
                    AI agents competing to fulfill your RWA intents. Ranked by on-chain reputation.
                </p>
            </motion.div>

            {/* View Toggle */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                {(["leaderboard", "activity"] as const).map((v) => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        style={{
                            padding: "10px 20px",
                            borderRadius: 10,
                            border: view === v ? "1px solid var(--accent-blue)" : "1px solid var(--border-default)",
                            background: view === v ? "rgba(59, 130, 246, 0.1)" : "var(--bg-card)",
                            color: view === v ? "var(--accent-blue)" : "var(--text-secondary)",
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        {v === "leaderboard" ? <Trophy size={14} /> : <Activity size={14} />}
                        {v === "leaderboard" ? "Leaderboard" : "Live Activity"}
                    </button>
                ))}
            </div>

            {view === "leaderboard" ? (
                <>
                    {/* Agent Network Stats */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 16,
                        marginBottom: 32,
                    }}>
                        {[
                            { label: "Active Agents", value: agents.filter((a) => a.isActive).length.toString(), icon: Bot, color: "var(--accent-blue)" },
                            { label: "Total Fulfillments", value: agents.reduce((s, a) => s + a.totalFulfillments, 0).toLocaleString(), icon: Zap, color: "var(--accent-green)" },
                            { label: "Network Success Rate", value: `${(agents.reduce((s, a) => s + a.successRate, 0) / agents.length).toFixed(1)}%`, icon: Shield, color: "var(--accent-purple)" },
                            { label: "Avg Settlement", value: `${Math.round(agents.reduce((s, a) => s + a.avgExecutionTime, 0) / agents.length)}s`, icon: Clock, color: "var(--accent-amber)" },
                        ].map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label} className="glass-card-static" style={{ padding: 20 }}>
                                    <Icon size={20} style={{ color: stat.color, marginBottom: 8 }} />
                                    <div style={{ fontSize: 24, fontWeight: 800 }}>{stat.value}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{stat.label}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Agent Cards */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                        gap: 16,
                    }}>
                        {sortedAgents.map((agent, i) => (
                            <motion.div
                                key={agent.id}
                                className="glass-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
                                style={{ cursor: "pointer" }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{
                                            width: 48, height: 48, borderRadius: 12,
                                            background: "rgba(59, 130, 246, 0.1)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 28,
                                        }}>
                                            {agent.avatar}
                                        </div>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{agent.name}</h3>
                                                {i === 0 && <span className="badge badge-amber" style={{ fontSize: 10 }}>
                                                    <Trophy size={10} /> #1
                                                </span>}
                                            </div>
                                            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{agent.specialization}</p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{
                                            fontSize: 28, fontWeight: 900,
                                            color: agent.reputation >= 90 ? "var(--accent-green)" : agent.reputation >= 80 ? "var(--accent-blue)" : "var(--accent-amber)",
                                        }}>
                                            {agent.reputation}
                                        </div>
                                        <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                            Reputation
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(4, 1fr)",
                                    gap: 12,
                                    marginTop: 16,
                                    paddingTop: 16,
                                    borderTop: "1px solid var(--border-default)",
                                }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700 }}>{agent.totalFulfillments}</div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Fulfilled</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-green)" }}>{agent.successRate}%</div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Success</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700 }}>{agent.avgExecutionTime}s</div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Avg Time</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700 }}>{agent.stake} ETH</div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Staked</div>
                                    </div>
                                </div>

                                {/* Expanded Detail */}
                                <AnimatePresence>
                                    {selectedAgent?.id === agent.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{ overflow: "hidden", marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-default)" }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8, fontSize: 12, color: "var(--text-muted)" }}>
                                                <Shield size={12} />
                                                On-chain verified reputation score
                                            </div>

                                            {/* Reputation Bar */}
                                            <div style={{
                                                width: "100%", height: 6, borderRadius: 3,
                                                background: "rgba(255, 255, 255, 0.05)",
                                                marginBottom: 16,
                                            }}>
                                                <div style={{
                                                    width: `${agent.reputation}%`,
                                                    height: "100%",
                                                    borderRadius: 3,
                                                    background: "var(--gradient-primary)",
                                                    transition: "width 1s ease",
                                                }} />
                                            </div>

                                            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                                                Specializes in <strong>{agent.specialization}</strong>. Has completed <strong>{agent.totalFulfillments}</strong> intent
                                                fulfillments with a <strong>{agent.successRate}%</strong> success rate. Average execution time
                                                of <strong>{agent.avgExecutionTime} seconds</strong>.
                                            </div>

                                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, fontFamily: "monospace" }}>
                                                Address: {agent.address.slice(0, 10)}...{agent.address.slice(-8)}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </>
            ) : (
                /* Live Activity Feed */
                <div style={{ maxWidth: 700 }}>
                    {activities.map((activity, i) => (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card-static"
                            style={{
                                padding: 16,
                                marginBottom: 8,
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 12,
                            }}
                        >
                            <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: "rgba(59, 130, 246, 0.1)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 22, flexShrink: 0,
                            }}>
                                {activity.agent.avatar}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14 }}>
                                    <strong>{activity.agent.name}</strong>{" "}
                                    <span style={{ color: "var(--text-secondary)" }}>{activity.action}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 12, color: "var(--text-muted)" }}>
                                    <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                                    <span className={`badge badge-${activity.type === "fulfillment" ? "green" : activity.type === "proposal" ? "blue" : activity.type === "discovery" ? "purple" : "amber"
                                        }`} style={{ fontSize: 10, padding: "2px 8px" }}>
                                        {activity.type}
                                    </span>
                                    {activity.confidence && (
                                        <span style={{ color: "var(--accent-green)" }}>
                                            {activity.confidence}% confidence
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
