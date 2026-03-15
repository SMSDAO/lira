# WASM Acceleration Module

This directory contains WebAssembly modules for high-performance cryptographic
and mathematical operations used in the Lira platform.

## Modules

| Module | Purpose | Status |
|--------|---------|--------|
| `crypto_verify.wasm` | EIP-712 signature verification | Stub |
| `dex_math.wasm` | AMM constant-product / concentrated-liquidity math | Stub |

## Build

Rust source lives in `wasm/src/`. Build with:

```bash
cargo install wasm-pack
wasm-pack build --target web --out-dir wasm/pkg wasm/
```

## Usage (TypeScript)

```typescript
import { verifySiweSignature } from '@/wasm/crypto';
import { calculateAmountOut } from '@/wasm/dex_math';
```

See `src/wasm/crypto.ts` and `src/wasm/dex_math.ts` for the TypeScript host bindings.
