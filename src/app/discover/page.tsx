"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Search,
    TrendingUp,
    TrendingDown,
    Globe,
    Landmark,
    Building2,
    Gem,
    DollarSign,
    ExternalLink,
    Zap,
    ChevronDown,
} from "lucide-react";
import { formatCurrency, formatCompact, formatPercent } from "@/lib/utils";
import { RWA_CATEGORIES, type CoinGeckoAsset } from "@/lib/coingecko";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    Globe: <Globe size={16} />,
    Landmark: <Landmark size={16} />,
    Building2: <Building2 size={16} />,
    Gem: <Gem size={16} />,
    DollarSign: <DollarSign size={16} />,
};

export default function DiscoverPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>(RWA_CATEGORIES[0].id);
    const [assets, setAssets] = useState<CoinGeckoAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"market_cap" | "price_change">("market_cap");

    useEffect(() => {
        async function fetchAssets() {
            setLoading(true);
            try {
                const res = await fetch(`/api/coingecko/assets?category=${selectedCategory}`);
                const data = await res.json();
                setAssets(data.assets || []);
            } catch (error) {
                console.error("Failed to fetch assets:", error);
                setAssets([]);
            }
            setLoading(false);
        }
        fetchAssets();
    }, [selectedCategory]);

    const filteredAssets = assets
        .filter((a) =>
            a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.symbol?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === "price_change") return (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0);
            return (b.market_cap || 0) - (a.market_cap || 0);
        });

    return (
        <div className="container" style={{ padding: "40px 16px 80px" }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 32 }}
            >
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
                    Discover Tokenized{" "}
                    <span className="gradient-text">Real-World Assets</span>
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
                        Browse, analyze, and invest in tokenized treasuries, real estate, commodities, and more.
                    </p>
                    <a
                        href="https://www.coingecko.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="coingecko-badge"
                        style={{ textDecoration: "none", whiteSpace: "nowrap" }}
                    >
                        Powered by CoinGecko
                    </a>
                </div>
            </motion.div>

            {/* Category Tabs */}
            <div style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 4,
                marginBottom: 24,
            }}>
                {RWA_CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "10px 18px",
                            borderRadius: 10,
                            border: selectedCategory === cat.id
                                ? "1px solid var(--accent-blue)"
                                : "1px solid var(--border-default)",
                            background: selectedCategory === cat.id
                                ? "rgba(59, 130, 246, 0.1)"
                                : "var(--bg-card)",
                            color: selectedCategory === cat.id
                                ? "var(--accent-blue)"
                                : "var(--text-secondary)",
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            transition: "all 0.2s ease",
                        }}
                    >
                        {CATEGORY_ICONS[cat.icon]}
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Search + Sort */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                <div style={{
                    flex: 1,
                    minWidth: 240,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 16px",
                    border: "1px solid var(--border-default)",
                    borderRadius: 10,
                    background: "var(--bg-card)",
                }}>
                    <Search size={16} style={{ color: "var(--text-muted)" }} />
                    <input
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            color: "var(--text-primary)",
                            fontSize: 14,
                            width: "100%",
                        }}
                    />
                </div>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "market_cap" | "price_change")}
                    style={{
                        padding: "10px 16px",
                        border: "1px solid var(--border-default)",
                        borderRadius: 10,
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        fontSize: 14,
                        cursor: "pointer",
                    }}
                >
                    <option value="market_cap">Sort: Market Cap</option>
                    <option value="price_change">Sort: 24h Change</option>
                </select>
            </div>

            {/* Asset Grid */}
            {loading ? (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: 16,
                }}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />
                    ))}
                </div>
            ) : filteredAssets.length === 0 ? (
                <div className="glass-card-static" style={{ textAlign: "center", padding: 60 }}>
                    <Globe size={48} style={{ color: "var(--text-muted)", marginBottom: 16 }} />
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Assets Found</h3>
                    <p style={{ color: "var(--text-secondary)" }}>
                        Try a different category or search term.
                    </p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: 16,
                    }}
                >
                    <AnimatePresence>
                        {filteredAssets.map((asset, i) => (
                            <motion.div
                                key={asset.id}
                                className="glass-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                style={{ cursor: "pointer" }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        {asset.image ? (
                                            <img
                                                src={asset.image}
                                                alt={asset.name}
                                                style={{ width: 40, height: 40, borderRadius: 10 }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 10,
                                                background: "var(--gradient-primary)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 16, fontWeight: 700, color: "white",
                                            }}>
                                                {asset.symbol?.slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <h3 style={{ fontSize: 16, fontWeight: 700 }}>{asset.name}</h3>
                                            <p style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "uppercase" }}>
                                                {asset.symbol}
                                            </p>
                                        </div>
                                    </div>
                                    {asset.market_cap_rank && (
                                        <span className="badge badge-blue">#{asset.market_cap_rank}</span>
                                    )}
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                    <div>
                                        <div style={{ fontSize: 24, fontWeight: 800 }}>
                                            {asset.current_price ? formatCurrency(asset.current_price) : "N/A"}
                                        </div>
                                        {asset.price_change_percentage_24h !== undefined && (
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                                marginTop: 4,
                                                color: asset.price_change_percentage_24h >= 0 ? "var(--accent-green)" : "var(--accent-rose)",
                                                fontSize: 14,
                                                fontWeight: 600,
                                            }}>
                                                {asset.price_change_percentage_24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                {formatPercent(asset.price_change_percentage_24h)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Sparkline */}
                                    {asset.sparkline_in_7d?.price && (
                                        <svg width="80" height="32" viewBox="0 0 80 32" style={{ overflow: "visible" }}>
                                            <polyline
                                                points={asset.sparkline_in_7d.price
                                                    .filter((_, i) => i % Math.max(1, Math.floor(asset.sparkline_in_7d!.price.length / 40)) === 0)
                                                    .map((p, i, arr) => {
                                                        const min = Math.min(...arr);
                                                        const max = Math.max(...arr);
                                                        const range = max - min || 1;
                                                        const x = (i / (arr.length - 1)) * 80;
                                                        const y = 32 - ((p - min) / range) * 30;
                                                        return `${x},${y}`;
                                                    })
                                                    .join(" ")}
                                                fill="none"
                                                stroke={
                                                    (asset.price_change_percentage_24h || 0) >= 0
                                                        ? "var(--accent-green)"
                                                        : "var(--accent-rose)"
                                                }
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </div>

                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginTop: 16,
                                    paddingTop: 12,
                                    borderTop: "1px solid var(--border-default)",
                                    fontSize: 12,
                                    color: "var(--text-muted)",
                                }}>
                                    <span>MCap: {asset.market_cap ? formatCompact(asset.market_cap) : "N/A"}</span>
                                    <span>Vol: {asset.total_volume ? formatCompact(asset.total_volume) : "N/A"}</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        <a
                                            href={`https://www.coingecko.com/en/coins/${asset.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: "#8ac640", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            CoinGecko <ExternalLink size={10} />
                                        </a>
                                    </div>
                                </div>

                                {/* Quick Action */}
                                <Link href={`/intents/new?asset=${asset.id}&name=${asset.name}&symbol=${asset.symbol}&price=${asset.current_price}`}>
                                    <button
                                        className="btn-primary"
                                        style={{
                                            width: "100%",
                                            marginTop: 12,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 6,
                                            padding: "10px",
                                            fontSize: 14,
                                        }}
                                    >
                                        <Zap size={14} />
                                        Buy with Intent
                                    </button>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
