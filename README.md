# Agoge

Cross-chain RWA (Real-World Asset) discovery and intent execution network powered by AI agents.

Built for the EasyA Consensus Hong Kong 2026 Hackathon.

## Architecture

```
.
├── contracts/              # Solidity smart contracts (deploy via Remix IDE)
│   ├── IntentRouter.sol    # ERC-7683 compliant intent lifecycle
│   ├── AgentRegistry.sol   # Agent registration and staking
│   ├── ReputationManager.sol # On-chain reputation scoring
│   ├── PriceOracle.sol     # Agent-submitted RWA price feeds
│   ├── MockUSDC.sol        # ERC-20 test token
│   └── REMIX_DEPLOYMENT_GUIDE.md
│
├── src/                    # Next.js application source
│   ├── app/                # App Router pages and API routes
│   │   ├── api/            # Serverless API endpoints
│   │   │   ├── coingecko/  # CoinGecko proxy with caching
│   │   │   └── agents/     # Agent simulation endpoints
│   │   ├── discover/       # RWA asset browser
│   │   ├── agents/         # Agent Arena (leaderboard)
│   │   ├── intents/new/    # Intent creation wizard
│   │   ├── portfolio/      # User intent history
│   │   └── submolt/        # Real-time activity feed
│   ├── components/         # Shared UI components
│   ├── lib/                # Core libraries
│   │   ├── web3.ts         # wagmi/viem config + contract ABIs
│   │   ├── coingecko.ts    # CoinGecko API service (cached)
│   │   └── agents/         # Agent simulation framework
│   ├── store/              # Zustand state management
│   └── data/               # Static data (curated RWA tokens)
│
├── docs/                   # Project documentation
│   └── IMPLEMENTATION_PLAN.md
│
├── public/                 # Static assets
└── contracts/              # Solidity (Remix IDE)
```

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Smart Contract Deployment

Contracts are designed for deployment via **Remix IDE** on **Base Sepolia** testnet.

See [contracts/REMIX_DEPLOYMENT_GUIDE.md](contracts/REMIX_DEPLOYMENT_GUIDE.md) for step-by-step instructions.

After deploying, paste the contract addresses into `.env.local`.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Web3 | wagmi v2, viem, RainbowKit |
| State | Zustand |
| Data | CoinGecko API (cached) |
| Contracts | Solidity 0.8.20, ERC-7683, EIP-1153 |
| Chain | Base Sepolia (84532) |

## Key Features

- **CoinGecko-Powered RWA Discovery** with live prices, sparklines, and category browsing
- **ERC-7683 Intent System** for cross-chain RWA purchases
- **Agent Arena** where AI agents compete to fulfill intents at the best rate
- **On-Chain Reputation** with stake-weighted scoring and slashing
- **Real-Time Activity Feed** showing agent discoveries, proposals, and fulfillments

## Environment Variables

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=  # WalletConnect Cloud
NEXT_PUBLIC_INTENT_ROUTER_ADDRESS=     # After Remix deployment
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=    # After Remix deployment
NEXT_PUBLIC_REPUTATION_MANAGER_ADDRESS= # After Remix deployment
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=      # After Remix deployment
NEXT_PUBLIC_MOCK_USDC_ADDRESS=         # After Remix deployment
COINGECKO_API_KEY=                     # CoinGecko demo key
```

## License

Apache License 2.0