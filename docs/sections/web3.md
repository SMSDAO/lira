# Web3 Integration

## Smart Contracts

### Deployed Contracts

| Contract | Purpose |
|----------|---------|
| `LiraToken` | ERC-20 governance + utility token |
| `LiraTokenRegistry` | On-chain registry of launched tokens |
| `TokenLaunchFactory` | Factory for user token launches |
| `LiraProfile` | On-chain identity (handle + metadata) |
| `LiraSocialGraph` | Follow / unfollow social graph |
| `AgentExecutor` | On-chain agent task execution |
| `LiraAccessToken` | ERC-1155 access token |

### Contract Interfaces

Auto-generated TypeScript interfaces live in `src/web3/contracts/interfaces.ts`. Service wrappers with error handling are in `src/services/contracts/index.ts`.

### Wiring Pattern

```typescript
import { safeContractCall, getContractAddress } from '@/services/contracts';

const address = getContractAddress('base', 'LiraTokenRegistry');
const result = await safeContractCall(
  'LiraTokenRegistry',
  'getToken',
  () => registryContract.getToken(tokenAddress),
);
```

## Wallet Authentication (SIWE)

1. `GET /api/auth/nonce` → receives one-time nonce  
2. Client signs SIWE message with their wallet  
3. `POST /api/auth/verify` with `{ message, signature, address }`  
4. Server verifies via `src/wasm/crypto.ts` → issues session  

## Farcaster Integration

- Sign-In-With-Farcaster (SIWF) via `src/auth/farcaster.ts`
- Profile sync: `GET /api/web3/farcaster-profile?fid=<fid>`
- Creator identity mapping: `toCreatorIdentity(profile)`

## Zora Integration

NFT minting via `src/web3/social/index.ts`:

```typescript
import { mintZoraNft } from '@/web3/social';

const receipt = await mintZoraNft({
  contractAddress: '0x…',
  tokenId: 1n,
  quantity: 1n,
  to: '0x…',
  comment: 'Minted via Lira Protocol',
});
```

## Supported Wallet Providers

Via RainbowKit:
- MetaMask
- Coinbase Wallet
- Phantom
- OKX Wallet
- Rainbow
- Ledger
