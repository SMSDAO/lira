/*!
 * Lira Core Engine
 *
 * A WASM-compatible DSL parser and safety-first compiler for Lira contracts.
 *
 * # Architecture
 *
 * ```text
 * source text  ──►  Lexer  ──►  Parser  ──►  AST
 *                                               │
 *                                     Validator / Safety Checker
 *                                               │
 *                                       CompileResult  ──►  WASM host / FFI
 * ```
 *
 * ## Safety-First flag
 *
 * When the `--strict` / `safety_first` option is enabled the compiler rejects
 * any contract that contains an *undefined state* — a state name referenced in
 * a transition that was never declared in the `states` block.
 */

pub mod ast;
pub mod compiler;
pub mod error;
pub mod lexer;
pub mod parser;
pub mod validator;

#[cfg(feature = "wasm")]
pub mod wasm_bindings;

pub use compiler::{compile, CompileOptions, CompileResult};
pub use error::LiraError;
