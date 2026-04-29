# Lira Core Engine

A **Rust-based, WASM-compatible** DSL parser and safety-first compiler for Lira contracts.

## Architecture

```
source text  ──►  Lexer  ──►  Parser  ──►  AST (LiraContract)
                                                │
                                      Validator / Safety Checker
                                                │
                                        CompileResult ──► WASM host / TypeScript FFI
```

## Modules

| Module | Purpose |
|--------|---------|
| `lexer.rs` | Tokenises Lira DSL source text |
| `parser.rs` | Builds a `LiraContract` AST from the token stream |
| `ast.rs` | AST node definitions (states, transitions, triggers, actions, safety checks) |
| `validator.rs` | Semantic validation — **Safety-First undefined-state check** |
| `compiler.rs` | High-level `compile(source, options)` entry point |
| `wasm_bindings.rs` | `wasm-bindgen` bindings for browser / Node.js consumption |

## Safety-First Flag

When `CompileOptions { safety_first: true }` is set (the `--strict` flag), the compiler **rejects any contract that references a state that was not declared** in the `states` block.  This prevents "logic-bleed" — undefined execution paths that could be exploited in financial transactions.

```rust
use lira_core::{compile, CompileOptions};

let result = compile(source, CompileOptions { safety_first: true });
match result {
    Ok(r)  => println!("✅ {}", r.contract.name),
    Err(e) => eprintln!("❌ {}", e.errors.join(", ")),
}
```

## Formal Verification Hooks

The `SafetyCheck` AST node allows inline invariant assertions:

```
safety_checks {
  check positive_amount: amount > 0 message: "Amount must be positive"
  check valid_collateral: collateral_ratio >= 1.5 message: "Under-collateralised"
}
```

At runtime the core engine evaluates these checks before executing any action.  A failing check halts execution and reverts the transaction — preventing financial logic errors.

## WASM Build

```bash
# Install wasm-pack (once)
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Build for browser / bundler targets
wasm-pack build --target web --out-dir ../wasm/pkg --features wasm

# The output pkg/ contains:
#   lira_core_bg.wasm   — optimised binary
#   lira_core.js        — JS glue
#   lira_core.d.ts      — TypeScript declarations
```

## TypeScript Usage (post-WASM build)

```typescript
import init, { lira_compile } from '../wasm/pkg/lira_core';

await init();

const result = JSON.parse(lira_compile(source, '{"safety_first":true}'));
if (result.ok) {
  console.log('Contract:', result.contract.name);
  console.log('Warnings:', result.warnings);
} else {
  console.error('Errors:', result.errors);
}
```

## Running Tests

```bash
cd core-engine

# Unit tests
cargo test --verbose

# Coverage (requires cargo-tarpaulin)
cargo install cargo-tarpaulin
cargo tarpaulin --out Xml

# Security audit
cargo install cargo-audit
cargo audit
```

## DSL Quick Reference

```
version "1.0"
contract MyTrade {
  states {
    Open initial
    Filled
    Cancelled terminal
  }

  transitions {
    Open -> Filled
    Open -> Cancelled  guard: amount > 0
  }

  triggers {
    price_threshold pair: "ETH/USD" > 3000
    margin_call collateral_ratio: 1.5
    schedule cron: "0 * * * *"
  }

  actions {
    transfer from: sender to: receiver token: USDC amount: 100
    emit event: TradeExecuted
    notify recipient: user message: "Your trade was filled"
  }

  safety_checks {
    check non_zero: amount > 0 message: "Amount must be positive"
  }
}
```
