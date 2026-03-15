# DEX Integration

## Overview

The DEX scanner indexes liquidity pools and token analytics across major decentralised exchanges.

## Supported Protocols

| Protocol | Chain | Subgraph / API |
|----------|-------|----------------|
| Uniswap v3 | Ethereum | The Graph |
| Uniswap v3 | Base | The Graph (Studio) |
| SushiSwap | Ethereum | The Graph |
| PancakeSwap | BNB Chain | The Graph |
| Curve | Ethereum | (planned) |
| Balancer | Ethereum | (planned) |
| GMX | Arbitrum | (planned) |

## Data Models

### `DexToken` (`src/models/DexToken.ts`)

Stores aggregated analytics per token:
- Price in USD, 24h price change
- 24h trading volume
- Total liquidity (TVL) across all indexed pools
- Pool details (address, protocol, fees, reserves)
- Historical price snapshots

### `DexPool`

Represents a single liquidity pool:
- Address, protocol, chain
- Token0 / Token1 addresses and symbols
- Fee tier (basis points)
- Liquidity USD, 24h volume

## API

```
GET /api/dex/tokens?chain=ethereum&sort=volume&limit=20
POST /api/dex/scan
```

## Running the Scanner

Via the `dexScanner` background job (every 5 minutes):

```typescript
import { runDexScan } from '@/dex/scanner';
const results = await runDexScan(50);
```

Or trigger manually:

```bash
curl -X POST http://localhost:3000/api/dex/scan
```

## WASM Math Acceleration

Constant-product AMM calculations (`src/wasm/dex_math.ts`):

```typescript
import { calcAmountOut, calcPriceImpact } from '@/wasm/dex_math';

const out = calcAmountOut(1_000_000n, 1_000_000_000n, 2_000_000_000n, 30);
const impact = calcPriceImpact(1_000_000n, 1_000_000_000n);
```
