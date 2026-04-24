/// High-level compilation entry point.
///
/// `compile(source, options)` is the single function exposed by the core
/// engine.  It runs the full pipeline:
///
/// ```text
/// source → Lexer → Parser → Validator → CompileResult
/// ```
///
/// The `CompileResult` contains the AST, a JSON serialisation, and any
/// validation warnings.

use serde::{Deserialize, Serialize};

use crate::ast::LiraContract;
use crate::error::LiraError;
use crate::lexer::Lexer;
use crate::parser::Parser;
use crate::validator;

// ──────────────────────────────────────────────────────────────────────────────
// Public types
// ──────────────────────────────────────────────────────────────────────────────

/// Options passed to `compile`.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CompileOptions {
    /// When `true`, the compiler rejects any contract that references an
    /// undefined state — the *Safety-First* flag.
    pub safety_first: bool,
}

/// The result of a successful compilation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompileResult {
    /// The fully validated AST.
    pub contract: LiraContract,
    /// Canonical JSON representation of the contract, suitable for storage and
    /// transmission to the blockchain indexer or web front-end.
    pub json: String,
    /// Non-fatal warnings (e.g. unused states). Empty when there are none.
    pub warnings: Vec<String>,
}

/// The result of a failed compilation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompileErrors {
    /// One or more hard errors that prevent the contract from being used.
    pub errors: Vec<String>,
}

// ──────────────────────────────────────────────────────────────────────────────
// Compile function
// ──────────────────────────────────────────────────────────────────────────────

/// Compile Lira DSL source into a validated `CompileResult`.
///
/// Returns `Err(CompileErrors)` if lexing, parsing, or validation fails.
pub fn compile(source: &str, options: CompileOptions) -> Result<CompileResult, CompileErrors> {
    // 1. Lex
    let tokens = Lexer::new(source).tokenize().map_err(|e| CompileErrors {
        errors: vec![e.to_string()],
    })?;

    // 2. Parse
    let contract = Parser::new(tokens).parse().map_err(|e| CompileErrors {
        errors: vec![e.to_string()],
    })?;

    // 3. Validate
    validator::validate(&contract, options.safety_first).map_err(|errs| CompileErrors {
        errors: errs.iter().map(|e| e.to_string()).collect(),
    })?;

    // 4. Serialise to JSON
    let json = serde_json::to_string_pretty(&contract).map_err(|e| CompileErrors {
        errors: vec![LiraError::Serialisation(e.to_string()).to_string()],
    })?;

    // 5. Collect warnings (non-fatal checks)
    let warnings = collect_warnings(&contract);

    Ok(CompileResult { contract, json, warnings })
}

// ──────────────────────────────────────────────────────────────────────────────
// Warning collection
// ──────────────────────────────────────────────────────────────────────────────

fn collect_warnings(contract: &LiraContract) -> Vec<String> {
    use std::collections::HashSet;
    let mut warnings = Vec::new();

    // Warn about states that are declared but never referenced in transitions.
    let referenced: HashSet<&str> = contract
        .transitions
        .iter()
        .flat_map(|t| [t.from.as_str(), t.to.as_str()])
        .collect();

    for state in &contract.states {
        if !state.initial && !state.terminal && !referenced.contains(state.name.as_str()) {
            warnings.push(format!(
                "State '{}' is declared but never referenced in any transition",
                state.name
            ));
        }
    }

    // Warn when no safety checks are defined.
    if contract.safety_checks.is_empty() {
        warnings.push(
            "No safety_checks defined — consider adding invariant assertions to \
             prevent logic-bleed in financial transactions"
                .to_string(),
        );
    }

    warnings
}

#[cfg(test)]
mod tests {
    use super::*;

    const VALID_SRC: &str = r#"
version "1.0"
contract Trade {
  states {
    Open initial
    Filled
    Cancelled terminal
  }
  transitions {
    Open -> Filled
    Open -> Cancelled
    Filled -> Cancelled
  }
  safety_checks {
    check positive_amount: amount > 0 message: "Amount must be positive"
  }
}
"#;

    const UNDEFINED_STATE_SRC: &str = r#"
version "1.0"
contract Bad {
  states {
    Start initial
  }
  transitions {
    Start -> NonExistent
  }
  safety_checks {
    check ok: true message: "fine"
  }
}
"#;

    #[test]
    fn compile_valid_contract_succeeds() {
        let result = compile(VALID_SRC, CompileOptions { safety_first: true });
        assert!(result.is_ok(), "{:?}", result);
        let r = result.unwrap();
        assert_eq!(r.contract.name, "Trade");
        assert!(!r.json.is_empty());
    }

    #[test]
    fn safety_first_rejects_undefined_state() {
        let result = compile(UNDEFINED_STATE_SRC, CompileOptions { safety_first: true });
        assert!(result.is_err());
        let errs = result.unwrap_err();
        assert!(errs.errors.iter().any(|e| e.contains("undefined state") || e.contains("NonExistent") || e.contains("Safety")));
    }

    #[test]
    fn non_strict_accepts_undefined_state() {
        let result = compile(UNDEFINED_STATE_SRC, CompileOptions { safety_first: false });
        assert!(result.is_ok());
    }

    #[test]
    fn warnings_emitted_for_no_safety_checks() {
        let src = r#"
version "1.0"
contract W {
  states { A initial B terminal }
  transitions { A -> B }
}
"#;
        let r = compile(src, CompileOptions::default()).unwrap();
        assert!(r.warnings.iter().any(|w| w.contains("safety_checks")));
    }

    #[test]
    fn json_output_is_valid_json() {
        let r = compile(VALID_SRC, CompileOptions { safety_first: true }).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&r.json).unwrap();
        assert_eq!(parsed["name"], "Trade");
    }
}
