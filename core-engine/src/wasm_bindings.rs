/// WASM bindings — compiled only when the `wasm` feature is enabled.
///
/// Exposes `lira_compile(source, options_json)` to JavaScript / TypeScript
/// via `wasm-bindgen`.

use wasm_bindgen::prelude::*;

use crate::compiler::{compile, CompileOptions};

/// Compile a Lira DSL contract from the browser / Node.js.
///
/// `options_json` is a JSON string matching `CompileOptions`; pass `"{}"` for
/// defaults.
///
/// Returns a JSON string that is either:
/// - `{ "ok": true, "contract": …, "json": …, "warnings": […] }` on success
/// - `{ "ok": false, "errors": […] }` on failure
#[wasm_bindgen]
pub fn lira_compile(source: &str, options_json: &str) -> String {
    // Set a human-friendly panic message in the browser console.
    #[cfg(feature = "wasm")]
    console_error_panic_hook::set_once();

    let options: CompileOptions = serde_json::from_str(options_json).unwrap_or_default();

    match compile(source, options) {
        Ok(result) => {
            serde_json::json!({
                "ok": true,
                "contract": result.contract,
                "json": result.json,
                "warnings": result.warnings,
            })
            .to_string()
        }
        Err(errors) => {
            serde_json::json!({
                "ok": false,
                "errors": errors.errors,
            })
            .to_string()
        }
    }
}
