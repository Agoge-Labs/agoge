"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Zap,
  Shield,
  Globe,
  TrendingUp,
  Users,
  Clock,
  BarChart3,
  ChevronRight,
  Bot,
  Layers,
  Activity,
} from "lucide-react";
import { getDemoStats, DEMO_AGENTS } from "@/lib/agents/agent-simulator";

const stats = getDemoStats();

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

export default function LandingPage() {
  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      {/* Hero Section */}
      <section style={{ position: "relative", padding: "80px 0 60px", minHeight: "90vh", display: "flex", alignItems: "center" }}>
        <div className="container">
          <motion.div
            initial="hidden"
            animate="visible"
            style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}
          >
            {/* Urgency Badge */}
            <motion.div custom={0} variants={fadeUp} style={{ marginBottom: 24 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 20px",
                  borderRadius: 24,
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "#f87171",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#ef4444",
                  animation: "pulse-glow 2s infinite",
                }} />
                THE AGENTIC ECONOMY WAITS FOR NO ONE
              </span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              custom={1}
              variants={fadeUp}
              style={{
                fontSize: "clamp(40px, 6vw, 72px)",
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                marginBottom: 24,
              }}
            >
              Cross-Chain{" "}
              <span className="gradient-text">RWA Discovery</span>
              <br />
              for AI Agents
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              custom={2}
              variants={fadeUp}
              style={{
                fontSize: "clamp(16px, 2vw, 20px)",
                color: "var(--text-secondary)",
                maxWidth: 600,
                margin: "0 auto 40px",
                lineHeight: 1.6,
              }}
            >
              Discover tokenized Real-World Assets. Express purchase intents.
              Watch AI agents compete to fulfill them at the best rate.
              All on-chain, all verifiable, all autonomous.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              custom={3}
              variants={fadeUp}
              style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}
            >
              <Link href="/discover">
                <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, padding: "16px 36px" }}>
                  Explore RWA Assets
                  <ArrowRight size={18} />
                </button>
              </Link>
              <Link href="/agents">
                <button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, padding: "16px 36px" }}>
                  <Bot size={18} />
                  View Agent Arena
                </button>
              </Link>
            </motion.div>

            {/* CoinGecko Badge */}
            <motion.div custom={4} variants={fadeUp} style={{ marginTop: 32 }}>
              <a
                href="https://www.coingecko.com"
                target="_blank"
                rel="noopener noreferrer"
                className="coingecko-badge"
                style={{ textDecoration: "none" }}
              >
                <svg width="16" height="16" viewBox="0 0 276 276" fill="none">
                  <circle cx="138" cy="138" r="138" fill="#8AC640" />
                  <text x="138" y="155" textAnchor="middle" fill="white" fontSize="120" fontWeight="bold">CG</text>
                </svg>
                Real-time RWA Data Powered by CoinGecko API
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ borderTop: "1px solid var(--border-default)", borderBottom: "1px solid var(--border-default)", padding: "32px 0" }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 24,
              textAlign: "center",
            }}
          >
            {[
              { value: stats.totalRWAsTracked.toString(), label: "RWAs Tracked", icon: BarChart3 },
              { value: `${stats.activeAgents}`, label: "Active Agents", icon: Bot },
              { value: `${stats.successRate}%`, label: "Success Rate", icon: Shield },
              { value: `${stats.avgFulfillmentTime}s`, label: "Avg. Settlement", icon: Clock },
              { value: `$${(stats.totalVolume / 1_000_000).toFixed(1)}M`, label: "Volume Processed", icon: TrendingUp },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label}>
                  <Icon size={20} style={{ color: "var(--accent-blue)", marginBottom: 8 }} />
                  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Why Now Section - Urgency */}
      <section style={{ padding: "80px 0" }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 56 }}
          >
            <span className="badge badge-red" style={{ marginBottom: 16 }}>URGENT</span>
            <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
              Why the Agentic Economy Needs Agoge <span style={{ fontStyle: "italic" }}>Now</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: 640, margin: "0 auto", lineHeight: 1.6 }}>
              AI agents are already managing billions in DeFi. But they lack a standardized way to discover,
              evaluate, and acquire Real-World Assets across chains. Every day without infrastructure, the gap widens.
            </p>
          </motion.div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}>
            {[
              {
                icon: Bot,
                title: "100K+ AI Agents Active in DeFi",
                desc: "Autonomous agents are trading, lending, and providing liquidity. But they cannot access the $16T+ tokenized RWA market efficiently.",
                color: "var(--accent-blue)",
              },
              {
                icon: Layers,
                title: "Fragmented Across 50+ Chains",
                desc: "RWA tokens are scattered across Ethereum, Base, Arbitrum, and dozens more. Manual bridging is slow, expensive, and error-prone.",
                color: "var(--accent-purple)",
              },
              {
                icon: Activity,
                title: "No Standardized Intent Layer",
                desc: "ERC-7683 enables cross-chain intents, but no platform connects it to agent intelligence and RWA discovery. Until now.",
                color: "var(--accent-green)",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  className="glass-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `${item.color}15`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 16,
                  }}>
                    <Icon size={24} style={{ color: item.color }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: "80px 0", background: "rgba(255, 255, 255, 0.01)" }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 56 }}
          >
            <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
              How Agoge Works
            </h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: 500, margin: "0 auto" }}>
              From discovery to execution in four steps.
              AI agents handle the complexity so you do not have to.
            </p>
          </motion.div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 24,
          }}>
            {[
              { step: "01", title: "Discover RWAs", desc: "Browse tokenized real-world assets powered by CoinGecko API. Treasuries, real estate, commodities, and more.", icon: Globe },
              { step: "02", title: "Express Intent", desc: "Tell us what you want to buy and where you want it settled. No complex bridging or swapping needed.", icon: Zap },
              { step: "03", title: "Agents Compete", desc: "AI agents analyze your intent and compete to offer the best execution price, speed, and route.", icon: Users },
              { step: "04", title: "Auto-Execute", desc: "Select the best proposal and the system executes it. Track progress in real-time on-chain.", icon: Shield },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  className="glass-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  style={{ textAlign: "center" }}
                >
                  <div style={{
                    fontSize: 40, fontWeight: 900, color: "rgba(59, 130, 246, 0.15)",
                    marginBottom: 8,
                  }}>
                    {item.step}
                  </div>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: "rgba(59, 130, 246, 0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px",
                  }}>
                    <Icon size={24} style={{ color: "var(--accent-blue)" }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Active Agents Preview */}
      <section style={{ padding: "80px 0" }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
              Meet the Agent Network
            </h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: 500, margin: "0 auto" }}>
              Specialized AI agents standing by to fulfill your RWA intents.
            </p>
          </motion.div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}>
            {DEMO_AGENTS.map((agent, i) => (
              <motion.div
                key={agent.id}
                className="glass-card"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ textAlign: "center", padding: 20 }}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>{agent.avatar}</div>
                <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{agent.name}</h4>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                  {agent.specialization}
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: "var(--accent-green)" }}>
                      {agent.reputation}
                    </div>
                    <div style={{ color: "var(--text-muted)" }}>Score</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>
                      {agent.successRate}%
                    </div>
                    <div style={{ color: "var(--text-muted)" }}>Success</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>
                      {agent.avgExecutionTime}s
                    </div>
                    <div style={{ color: "var(--text-muted)" }}>Avg Time</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Link href="/agents">
              <button className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                View Full Agent Arena
                <ChevronRight size={16} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section style={{ padding: "60px 0 100px" }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ textAlign: "center" }}
          >
            <p style={{ color: "var(--text-muted)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24 }}>
              Built With
            </p>
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 32,
            }}>
              {[
                "ERC-7683",
                "Base",
                "CoinGecko API",
                "Next.js",
                "wagmi/viem",
                "AI Agents",
              ].map((tech) => (
                <span
                  key={tech}
                  style={{
                    padding: "8px 20px",
                    border: "1px solid var(--border-default)",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
