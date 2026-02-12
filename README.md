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

Contracts are designed for deployment via **Remix IDE** on **Mantle Sepolia** testnet.

See [contracts/REMIX_DEPLOYMENT_GUIDE.md](contracts/REMIX_DEPLOYMENT_GUIDE.md) for step-by-step instructions.

After deploying, paste the contract addresses into `.env.local`.

## Deployed Contracts (Mantle Sepolia)

| Contract | Address |
|---|---|
| **IntentRouter** | [`0xe0D1c854651b9Ba015625542630B7332B8557D71`](https://sepolia.mantlescan.xyz/address/0xe0D1c854651b9Ba015625542630B7332B8557D71) |
| **AgentRegistry** | [`0x5421832836aA75556fA5a66c0Ac77e6f7FFeD3d4`](https://sepolia.mantlescan.xyz/address/0x5421832836aA75556fA5a66c0Ac77e6f7FFeD3d4) |
| **ReputationManager** | [`0xa655F2631b55896e10Ecd26934584124b4ba8493`](https://sepolia.mantlescan.xyz/address/0xa655F2631b55896e10Ecd26934584124b4ba8493) |
| **PriceOracle** | [`0x9D3f8B9C605347bD519660523275ef618c7D1E09`](https://sepolia.mantlescan.xyz/address/0x9D3f8B9C605347bD519660523275ef618c7D1E09) |
| **MockUSDC** | [`0x68F446aFC78819d6F4486aB82257cdfF057F65aC`](https://sepolia.mantlescan.xyz/address/0x68F446aFC78819d6F4486aB82257cdfF057F65aC) |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Web3 | wagmi v2, viem, RainbowKit |
| State | Zustand |
| Data | CoinGecko API (cached) |
| Contracts | Solidity 0.8.20, ERC-7683, EIP-1153 |
| Chain | Mantle Sepolia (5003) |

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