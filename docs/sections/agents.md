# Agents

## Overview

The Lira agent swarm consists of 9 specialised agents coordinated by `AgentCoordinator`. Agents communicate via an in-process event bus (upgradeable to Redis Pub/Sub + BullMQ).

## Agent Roster

| Agent | Purpose | Job Queue |
|-------|---------|-----------|
| `AgentCoordinator` | Dispatches tasks to the swarm, monitors health | — |
| `DexScannerAgent` | Indexes liquidity pools across DEXes | `dexScanner` |
| `WalletAgent` | Monitors wallet RPC for transfers & events | `walletMonitor` |
| `ImageGenerationAgent` | Processes AI image generation requests | `imageGenerator` |
| `SocialAgent` | Publishes queued casts to Farcaster / Zora | `socialPublisher` |
| `AnalyticsAgent` | Aggregates user and protocol analytics | `analyticsAggregator` |
| `MonitoringAgent` | Pings external services; updates health status | — |
| `NotificationAgent` | Sends alerts to users | — |
| `GovernanceAgent` | Processes on-chain governance proposals | `contractWatcher` |

## Communication

All agents emit and listen on the `agentBus` (an `EventEmitter` singleton in `src/agents/index.ts`). In production, replace the bus with a Redis Pub/Sub client.

## API

- `GET /api/agents` – list registered agents  
- `GET /api/agents/{id}` – get agent details  
- `POST /api/agents/{id}` – trigger agent execution  

## Usage

```typescript
import {
  AgentCoordinator,
  DexScannerAgent,
} from '@/agents';

const coordinator = AgentCoordinator.getInstance();
const scanner = new DexScannerAgent();
coordinator.register(scanner);

const task = coordinator.enqueue({
  agentType: 'DexScannerAgent',
  payload: { limit: 50 },
  priority: 5,
});
```
