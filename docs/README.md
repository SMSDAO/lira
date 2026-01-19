# Lira Protocol - Comprehensive Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Smart Contracts](#smart-contracts)
5. [Backend Services](#backend-services)
6. [Frontend Application](#frontend-application)
7. [Quantum Oracle](#quantum-oracle)
8. [Database Schema](#database-schema)
9. [API Documentation](#api-documentation)
10. [Deployment](#deployment)
11. [Security](#security)
12. [Contributing](#contributing)

## Overview

Lira Protocol is a redesigned Zora protocol implemented as a hybrid web application featuring:

- **Multi-Language Architecture**: React/Next.js, PHP, Go, Java, Q#
- **Quantum Computing**: Q# quantum brain oracle for advanced intelligence
- **Smart Contracts**: Solidity contracts for BASE and Monad mainnets
- **Parallel Agent Execution**: Deploy and execute multiple AI agents simultaneously
- **Auto Token Launch**: Automatic token deployment with built-in liquidity
- **Social Features**: Timeline, smart wallets, and social interactions (Zora-inspired)
- **Admin Dashboard**: Full control over fees, settings, billing, and users
- **Aura FX Neo Digital UI**: Dark themed glow effects with modern design

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js/React)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ User Dashboard│  │Admin Dashboard│  │Token Launcher│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
│  PHP API     │    │   Go API    │    │  Java API   │
│ (REST/CRUD)  │    │  (Agents)   │    │  (Oracle)   │
└───────┬──────┘    └──────┬──────┘    └──────┬──────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    ┌───────▼───────┐
                    │   PostgreSQL  │
                    │   Database    │
                    └───────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Blockchain Layer (BASE/Monad)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  LiraToken   │  │TokenLauncher │  │AgentExecutor │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Quantum Oracle (Q#)                        │
│           Quantum Brain Intelligence Layer                   │
└─────────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PHP >= 8.1
- Go >= 1.21
- Java >= 17 (with Maven)
- PostgreSQL >= 14
- Docker (optional)
- Q# Development Kit (optional)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/SMSDAO/lira.git
cd lira
```

2. **Run bootstrap script** (Windows PowerShell)
```powershell
.\scripts\bootstrap.ps1
```

Or manually:

3. **Install dependencies**
```bash
npm install
cd backend/php && composer install
cd ../go && go mod download
cd ../java && mvn install
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Set up database**
```bash
psql -U postgres -d lira -f database/schema.sql
```

6. **Compile contracts**
```bash
npx hardhat compile
```

7. **Start development servers**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: PHP API
npm run php:serve

# Terminal 3: Go API
cd backend/go && go run cmd/api/main.go

# Terminal 4: Java API (if needed)
cd backend/java && mvn spring-boot:run
```

## Smart Contracts

### LiraToken Contract

The base ERC20 token with governance features.

**Key Features:**
- Max supply: 1 billion tokens
- Minting control with authorized minters
- Protocol and creator fees
- Pausable for emergency situations
- BASE and Monad compatible

**Contract Address (BASE):** TBD after deployment

### TokenLaunchFactory Contract

Automated token launch factory with bonding curve.

**Key Features:**
- One-click token deployment
- Automatic liquidity setup
- Launch fee collection
- Creator tracking
- Multi-chain support

### AgentExecutor Contract

Manages AI agent execution and model deployment.

**Key Features:**
- Create custom agents
- Execute agents with quantum oracle integration
- Batch parallel execution
- Fee management
- Execution history tracking

## Backend Services

### PHP API (Port 8000)

RESTful API for CRUD operations.

**Endpoints:**
- `/api/users` - User management
- `/api/tokens` - Token tracking
- `/api/agents` - Agent management

### Go API (Port 8080)

High-performance agent execution service.

**Endpoints:**
- `/api/agents` - Agent operations
- `/api/agents/:id/execute` - Execute single agent
- `/api/agents/batch-execute` - Parallel execution
- `/api/models` - Model management
- `/api/quantum/*` - Quantum oracle integration

### Java API (Port 8081)

Quantum oracle integration and advanced analytics.

**Endpoints:**
- `/api/quantum/predict` - Quantum predictions
- `/api/analytics/*` - Advanced analytics

## Frontend Application

### User Dashboard

Access at: `http://localhost:3000/dashboard`

Features:
- Token portfolio
- Agent management
- Timeline feed
- Smart wallet integration

### Admin Dashboard

Access at: `http://localhost:3000/admin`

Features:
- User management
- Fee configuration
- System monitoring
- Billing oversight
- Security settings

### Token Launch Interface

Access at: `http://localhost:3000/launch`

Features:
- One-click token creation
- Logo upload/AI generation
- Parameter configuration
- Automatic deployment

## Quantum Oracle

The Q# quantum brain oracle provides:

1. **Quantum Market Predictor**: Analyzes market trends using quantum superposition
2. **Token Launch Optimizer**: Optimizes launch parameters with quantum annealing
3. **Parallel Agent Executor**: Executes multiple agents with quantum parallelism

### Usage

```csharp
// Example: Market prediction
operation QuantumMarketPredictor(priceData, confidence) : (prediction, confidence)
```

## Database Schema

Key tables:
- `users` - User accounts and wallet addresses
- `tokens` - Launched tokens tracking
- `agents` - AI agents and models
- `agent_executions` - Execution history
- `timeline_posts` - Social timeline
- `fee_settings` - Protocol fee configuration
- `quantum_jobs` - Quantum oracle jobs

## API Documentation

### Create Agent (Go API)

```bash
POST /api/agents
Content-Type: application/json

{
  "name": "Market Analyzer",
  "model_type": "GPT-4"
}
```

### Execute Agent

```bash
POST /api/agents/:id/execute
Content-Type: application/json

{
  "input_data": "Analyze BTC/USD"
}
```

### Launch Token (Contract)

```javascript
const tx = await tokenFactory.launchToken(
  "MyToken",
  "MTK",
  1000000,
  { value: ethers.parseEther("0.01") }
);
```

## Deployment

### Deploy to BASE Mainnet

1. **Configure environment**
```bash
BASE_RPC_URL=https://mainnet.base.org
PRIVATE_KEY=your_private_key
```

2. **Deploy contracts**
```powershell
.\scripts\contracts.ps1 -Network base -Action deploy
```

3. **Verify contracts**
```powershell
.\scripts\contracts.ps1 -Network base -Action verify
```

### Deploy Frontend

```bash
npm run build
npm start
```

Or use Docker:
```bash
docker-compose up -d
```

## Security

### Audits

All smart contracts have been designed with security best practices:

- ReentrancyGuard on all external calls
- Access control with Ownable
- Pausable for emergency stops
- Input validation
- Safe math operations (Solidity 0.8+)

**Audit Status:** Pending professional audit

### Best Practices

1. Never commit private keys
2. Use environment variables
3. Enable rate limiting in production
4. Regular security updates
5. Monitor contract events
6. Implement proper CORS

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

Apache 2.0 - See LICENSE.md

## Support

- GitHub Issues: https://github.com/SMSDAO/lira/issues
- Discord: [Coming soon]
- Email: support@lira.ai

---

Built with ❤️ by SMSDAO
