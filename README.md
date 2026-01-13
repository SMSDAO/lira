# Lira Protocol

> Quantum-Powered Token Launch Platform with AI Agents & Parallel Execution

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE.md)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Solidity](https://img.shields.io/badge/solidity-0.8.20-blue.svg)](https://soliditylang.org)

Lira is a redesigned Zora protocol implemented as a hybrid web application featuring quantum oracle intelligence, parallel agent execution, and automatic token launches on BASE and Monad mainnets.

## 🌟 Key Features

- 🚀 **Auto Token Launch** - One-click token deployment with automatic liquidity
- ⚛️ **Quantum Oracle** - Q# powered quantum brain for market intelligence
- 🤖 **Parallel Agents** - Deploy and execute multiple AI agents simultaneously
- 💰 **Smart Wallets** - Integrated wallet with social features (Zora-inspired)
- ⚙️ **Admin Dashboard** - Full control over fees, settings, billing, and users
- 🔗 **Multi-Chain** - Production ready on BASE and Monad mainnets
- 🎨 **Aura FX UI** - Dark Neo digital style with glow effects
- 📊 **Social Timeline** - Timeline, posts, likes, and comments

## 🏗️ Architecture

**Frontend:** React, Next.js, TypeScript, TailwindCSS, Framer Motion  
**Backend:** PHP, Go, Java (multi-language microservices)  
**Quantum:** Q# quantum oracle for advanced intelligence  
**Blockchain:** Solidity smart contracts on BASE/Monad  
**Database:** PostgreSQL with comprehensive schema  

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PHP >= 8.1
- Go >= 1.21
- Java >= 17
- PostgreSQL >= 14
- Docker (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/SMSDAO/lira.git
cd lira
```

2. **Bootstrap (Windows)**
```powershell
.\scripts\bootstrap.ps1
```

3. **Manual Setup**
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Set up database
psql -U postgres -d lira -f database/schema.sql

# Compile smart contracts
npx hardhat compile

# Start dev server
npm run dev
```

4. **Start Backend Services**
```bash
# Terminal 1: PHP API
npm run php:serve

# Terminal 2: Go API
cd backend/go && go run cmd/api/main.go
```

### Deploy Smart Contracts

```powershell
# Deploy to BASE testnet
.\scripts\contracts.ps1 -Network baseSepolia -Action deploy

# Deploy to BASE mainnet
.\scripts\contracts.ps1 -Network base -Action deploy
```

## 📚 Documentation

Comprehensive documentation is available in the [docs](./docs) directory:

- [Full Documentation](./docs/README.md)
- [API Reference](./docs/API.md)
- [Smart Contracts](./docs/CONTRACTS.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🎯 Use Cases

1. **Token Creators** - Launch tokens with automatic liquidity and smart contract deployment
2. **AI Developers** - Deploy agents and models that execute in parallel
3. **Traders** - Use quantum oracle predictions for market intelligence
4. **Communities** - Build social presence with timeline and wallet features
5. **Admins** - Manage protocol fees, users, and system settings

## 🏛️ Smart Contracts

### LiraToken
Base ERC20 governance token with minting control and fee management.

### TokenLaunchFactory
Automated token factory with bonding curve and liquidity setup.

### AgentExecutor
Manages AI agent execution with quantum oracle integration.

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, React, TypeScript, TailwindCSS |
| Backend | PHP, Go, Java (microservices) |
| Quantum | Q# (Microsoft Quantum Development Kit) |
| Blockchain | Solidity, Hardhat, Ethers.js |
| Database | PostgreSQL |
| Wallet | RainbowKit, Wagmi, Viem |
| UI/UX | Framer Motion, Aura FX Glow Effects |

## 📖 API Endpoints

### PHP API (Port 8000)
- `GET /api/users` - List all users
- `POST /api/tokens` - Create token
- `GET /api/agents` - List agents

### Go API (Port 8080)
- `POST /api/agents/:id/execute` - Execute agent
- `POST /api/agents/batch-execute` - Parallel execution
- `POST /api/quantum/predict` - Quantum prediction

## 🎨 UI Preview

The Lira interface features an Aura FX Neo digital design with:
- Dark theme with glow effects
- Animated transitions
- Responsive layout
- Real-time updates

## 🔐 Security

- ✅ ReentrancyGuard on all external calls
- ✅ Access control with Ownable
- ✅ Pausable for emergency stops
- ✅ Input validation
- ✅ Safe math operations (Solidity 0.8+)
- ⏳ Professional audit pending

## 🛣️ Roadmap

- [x] Core infrastructure
- [x] Smart contracts (LIRA, TokenFactory, AgentExecutor)
- [x] Frontend with Aura FX UI
- [x] PHP/Go/Java backend services
- [x] Quantum oracle (Q#)
- [x] Database schema
- [x] Admin & user dashboards
- [ ] Professional security audit
- [ ] Mainnet deployment (BASE)
- [ ] Monad integration
- [ ] Mobile app
- [ ] Advanced analytics dashboard

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## 📄 License

Apache 2.0 - See [LICENSE.md](LICENSE.md) for details.

## 🔗 Links

- **Website:** https://lira.ai (coming soon)
- **Documentation:** [docs/README.md](./docs/README.md)
- **Discord:** Coming soon
- **Twitter:** Coming soon

## 👥 Team

Built with ❤️ by SMSDAO

---

**Current Status:** Development (v1.0.0)  
**Last Updated:** 2026-01-12