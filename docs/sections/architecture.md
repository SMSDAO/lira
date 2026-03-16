# Architecture

## Overview

Lira Protocol is a fully autonomous enterprise Web3 AI platform built on Next.js, TypeScript strict mode, and the Base blockchain. The monorepo is structured as follows:

```
lira/
├── src/
│   ├── agents/            # Agent swarm (AgentCoordinator + 8 specialised agents)
│   ├── auth/              # Authentication providers, SIWE, Farcaster
│   ├── config/            # Centralised environment configuration
│   ├── core/rbac/         # Extended RBAC (7-tier role hierarchy)
│   ├── dex/               # DEX scanner (Uniswap, Sushi, Pancake, Curve…)
│   ├── jobs/              # Background job definitions (BullMQ-compatible)
│   ├── lib/               # Shared libraries (prisma, contracts, rbac legacy)
│   ├── models/            # TypeScript data models (Permission, DexToken, TimelineEvent)
│   ├── observability/     # Logging, metrics (Prometheus), tracing (OpenTelemetry)
│   ├── pages/             # Next.js pages + API routes
│   │   ├── api/
│   │   │   ├── admin/     # Admin API (billing, security, registry, moderation)
│   │   │   ├── agents/    # Agent management API
│   │   │   ├── auth/      # Auth API (nonce, verify)
│   │   │   ├── dex/       # DEX API (tokens, scan)
│   │   │   ├── images/    # AI image generation API
│   │   │   ├── jobs/      # Background job status API
│   │   │   ├── observability/ # Prometheus metrics endpoint
│   │   │   ├── social/    # Social API (feed, follow, profile)
│   │   │   ├── timeline/  # Timeline events API
│   │   │   ├── tokens/    # Token API
│   │   │   ├── users/     # User API
│   │   │   └── web3/      # Web3 API (Farcaster profile)
│   │   ├── dashboard/
│   │   │   ├── index.tsx  # User dashboard (home)
│   │   │   ├── user/      # User self-service dashboard
│   │   │   ├── admin/     # Admin governance dashboard
│   │   │   ├── dev/       # Developer portal
│   │   │   └── system/    # System control dashboard
│   │   ├── admin/         # Legacy admin page
│   │   ├── agents/        # Agents page
│   │   ├── dev/           # Legacy dev portal
│   │   └── …
│   ├── security/          # rateLimit, csrf, csp, requestValidation, audit
│   ├── services/          # Contract wrappers, image generation service
│   ├── timeline/          # Timeline tracking
│   ├── wasm/              # TypeScript host bindings for WASM modules
│   └── web3/
│       ├── contracts/     # Auto-generated contract interfaces
│       └── social/        # Farcaster + Zora integration
├── contracts/             # Solidity smart contracts
├── wasm/                  # WASM binaries + build instructions
├── docs/                  # Platform documentation
├── test/                  # Hardhat contract tests
└── …
```

## Core Technologies

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 18, Tailwind CSS, Framer Motion |
| Web3 | wagmi v2, viem, ethers v6, RainbowKit v2 |
| Database | Prisma + PostgreSQL |
| Contracts | Solidity (OpenZeppelin 5), Hardhat |
| Auth | SIWE (Sign-In-With-Ethereum), Farcaster, OAuth |
| Jobs | BullMQ + Redis |
| Observability | OpenTelemetry, Prometheus |
| WASM | Rust (wasm-pack) |
| CI/CD | GitHub Actions → Vercel |

## Key Design Decisions

1. **Non-destructive extension** – all new code is additive. Existing `src/lib/rbac.ts` is unchanged; the new `src/core/rbac/` extends it.
2. **TypeScript strict** – all new modules use strict type checking.
3. **Security-first** – every API route applies rate limiting. CSRF helpers and input validation schemas are available in `src/security/` and applied on routes where implemented. See `docs/sections/security.md` for current coverage.
4. **Observability by default** – metrics are exported in Prometheus format; tracing helpers (`startSpan`/`traced`) are available but must be wired into individual operations.
