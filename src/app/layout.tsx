import type { Metadata } from "next";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agoge | Cross-Chain RWA Discovery & Intent Execution for AI Agents",
  description:
    "Discover tokenized Real-World Assets, express cross-chain purchase intents, and let AI agents compete to fulfill them. Powered by CoinGecko.",
  keywords: [
    "RWA",
    "Real World Assets",
    "DeFi",
    "AI Agents",
    "Cross-Chain",
    "ERC-7683",
    "CoinGecko",
    "Base",
    "Tokenized Assets",
  ],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Agoge | Cross-Chain RWA Discovery for AI Agents",
    description: "The agentic economy is here. Discover, intent, execute.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
            <div className="particle-bg" />
            <Navbar />
            <main style={{ position: "relative", zIndex: 1 }}>{children}</main>
            {/* Footer */}
            <footer
              style={{
                position: "relative",
                zIndex: 1,
                borderTop: "1px solid var(--border-default)",
                padding: "32px 0",
                marginTop: 80,
              }}
            >
              <div className="container" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img src="/logo.png" alt="Agoge" width={24} height={24} style={{ borderRadius: 4 }} />
                  <span style={{ fontWeight: 700, fontSize: 16 }}>Agoge</span>
                  <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    Cross-Chain RWA Discovery for AI Agents
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span className="coingecko-badge">
                    <svg width="14" height="14" viewBox="0 0 276 276" fill="none">
                      <circle cx="138" cy="138" r="138" fill="#8AC640" />
                      <text x="138" y="155" textAnchor="middle" fill="white" fontSize="120" fontWeight="bold">
                        CG
                      </text>
                    </svg>
                    Powered by CoinGecko
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    Built for Consensus HK 2026
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
