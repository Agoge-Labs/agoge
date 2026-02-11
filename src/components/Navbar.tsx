"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import {
    Globe,
    Search,
    Zap,
    Users,
    BarChart3,
    Activity,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
    { href: "/discover", label: "Discover", icon: Search },
    { href: "/intents/new", label: "New Intent", icon: Zap },
    { href: "/agents", label: "Agent Arena", icon: Users },
    { href: "/portfolio", label: "Portfolio", icon: BarChart3 },
    { href: "/submolt", label: "Submolt", icon: Activity },
];

export function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav
            style={{
                position: "sticky",
                top: 0,
                zIndex: 50,
                borderBottom: "1px solid var(--border-default)",
                background: "rgba(5, 8, 22, 0.8)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
            }}
        >
            <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
                {/* Logo */}
                <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                    <img
                        src="/logo.png"
                        alt="Agoge"
                        width={56}
                        height={56}
                        style={{ borderRadius: 8 }}
                    />
                </Link>

                {/* Desktop Nav */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }} className="desktop-nav">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "8px 14px",
                                    borderRadius: 10,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    textDecoration: "none",
                                    color: isActive ? "var(--accent-blue)" : "var(--text-secondary)",
                                    background: isActive ? "rgba(59, 130, 246, 0.1)" : "transparent",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                <Icon size={16} />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Wallet + Mobile Toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <ConnectButton
                        chainStatus="icon"
                        accountStatus="avatar"
                        showBalance={false}
                    />
                    <button
                        className="mobile-toggle"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            display: "none",
                            padding: 4,
                        }}
                    >
                        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Nav */}
            {mobileOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                        borderTop: "1px solid var(--border-default)",
                        background: "var(--bg-secondary)",
                        padding: "12px 16px",
                    }}
                >
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "12px 16px",
                                    borderRadius: 10,
                                    fontSize: 15,
                                    fontWeight: 500,
                                    textDecoration: "none",
                                    color: isActive ? "var(--accent-blue)" : "var(--text-secondary)",
                                    background: isActive ? "rgba(59, 130, 246, 0.1)" : "transparent",
                                }}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </motion.div>
            )}

            <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
        </nav>
    );
}
