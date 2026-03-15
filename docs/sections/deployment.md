# Deployment

## Overview

Lira Protocol is deployed to Vercel (frontend/API) with a PostgreSQL database. GitHub Actions workflows handle CI/CD.

## Prerequisites

- Node.js ≥ 24.0.0
- npm ≥ 10.0.0
- PostgreSQL database (Vercel Postgres / Neon / Supabase)
- Vercel account

## Environment Variables

See `.env.example` for all required variables. Key production variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_LIRA_TOKEN` | LiraToken contract address |
| `NEXT_PUBLIC_FACTORY` | TokenLaunchFactory address |
| `NEXT_PUBLIC_REGISTRY_ADDRESS` | LiraTokenRegistry address |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Project ID |
| `OPENAI_API_KEY` | OpenAI API key (image generation) |
| `REPLICATE_API_TOKEN` | Replicate API token |
| `REDIS_URL` | Redis URL for BullMQ + rate limiting |
| `SESSION_SECRET` | 32-byte secret for session signing |
| `ADMIN_ADDRESSES` | Comma-separated admin wallet addresses |

## Local Development

```bash
npm install
cp .env.example .env.local
# Fill in .env.local
npm run db:generate
npm run db:migrate
npm run dev
```

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR + push to main | Lint, typecheck, test, build |
| `deploy-production.yml` | Push to main | Validate + gate Vercel deployment |
| `security-scan.yml` | PR + daily | Dependency audit + Slither contract scan |
| `docs.yml` | Push to main | Build and publish documentation |

## Docker

```bash
docker build -t lira .
docker run -p 3000:3000 --env-file .env lira
```

## PM2 (VPS)

```bash
npm run pm2:start
npm run pm2:logs
```

## Contracts

```bash
npm run contracts:compile
npm run contracts:test
NETWORK=base npm run contracts:deploy
```
