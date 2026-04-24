# WASM Acceleration Module

This directory is reserved for WebAssembly modules for high-performance cryptographic
and mathematical operations used in the Lira platform.

> **Note:** Rust WASM sources have not yet been added. The TypeScript host bindings in
> `src/wasm/crypto.ts` and `src/wasm/dex_math.ts` include pure-JS fallbacks that are
> used until the WASM binaries are compiled. The build instructions below apply once
> Rust sources are contributed.

## Planned Modules

| Module | Purpose | Status |
|--------|---------|--------|
| `crypto_verify.wasm` | EIP-712 signature verification | Planned |
| `dex_math.wasm` | AMM constant-product / concentrated-liquidity math | Planned |

## Build (when Rust sources are available)

```bash
cargo install wasm-pack
wasm-pack build --target web --out-dir wasm/pkg wasm/
```

## Usage (TypeScript)

```typescript
import { verifySiweSignature } from '@/wasm/crypto';
import { calcAmountOut, sqrtPriceX96ToPrice } from '@/wasm/dex_math';

const result = await verifySiweSignature(message, signature, address);
const amountOut = calcAmountOut(1_000_000n, 1_000_000_000n, 2_000_000_000n, 30);
```

See `src/wasm/crypto.ts` and `src/wasm/dex_math.ts` for full API documentation.
