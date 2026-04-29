/// Error types for the Lira core engine.
use thiserror::Error;

#[derive(Debug, Error, PartialEq, Clone)]
pub enum LiraError {
    // ── Lexer errors ──────────────────────────────────────────────────────────
    #[error("Unexpected character '{ch}' at line {line}, column {col}")]
    UnexpectedChar { ch: char, line: usize, col: usize },

    #[error("Unterminated string literal starting at line {line}")]
    UnterminatedString { line: usize },

    // ── Parser errors ─────────────────────────────────────────────────────────
    #[error("Expected {expected} but got '{got}' at line {line}")]
    UnexpectedToken {
        expected: String,
        got: String,
        line: usize,
    },

    #[error("Unexpected end of input")]
    UnexpectedEof,

    // ── Validation errors ─────────────────────────────────────────────────────
    /// Safety-First: a transition references a state that was never declared.
    #[error(
        "Safety violation: undefined state '{state}' referenced in transition \
         '{from}' → '{to}' (enable safety_first to reject such contracts)"
    )]
    UndefinedState {
        state: String,
        from: String,
        to: String,
    },

    /// A contract must declare at least one state.
    #[error("Contract '{name}' has no states declared")]
    NoStates { name: String },

    /// Exactly one initial state must be declared.
    #[error("Contract '{name}' must have exactly one initial state, found {count}")]
    InitialStateCount { name: String, count: usize },

    /// An action references an undeclared transition target.
    #[error("Action 'Transition' targets undefined state '{state}'")]
    UndefinedTransitionTarget { state: String },

    /// A safety-check condition is trivially false (constant `false` literal).
    #[error("Safety check '{id}' has a trivially-false condition — this will always revert")]
    TriviallyFalseCheck { id: String },

    /// An invalid numeric literal was encountered (e.g. multiple decimal points,
    /// empty buffer, or an integer overflow).
    #[error("Invalid numeric literal '{literal}' at line {line}")]
    InvalidNumericLiteral { literal: String, line: usize },

    // ── Compiler / codegen errors ─────────────────────────────────────────────
    #[error("Serialisation error: {0}")]
    Serialisation(String),

    #[error("Unsupported feature: {0}")]
    Unsupported(String),
}
