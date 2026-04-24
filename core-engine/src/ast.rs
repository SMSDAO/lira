/// Abstract Syntax Tree types for the Lira DSL.
///
/// A `LiraContract` is the top-level node produced by the parser.

use serde::{Deserialize, Serialize};

// ──────────────────────────────────────────────────────────────────────────────
// Top-level contract
// ──────────────────────────────────────────────────────────────────────────────

/// A fully parsed Lira contract.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LiraContract {
    /// Lira DSL version declared in the source (e.g. `"1.0"`).
    pub version: String,
    /// Human-readable contract name.
    pub name: String,
    /// Declared states.  At least one state is required.
    pub states: Vec<State>,
    /// State-machine transitions.
    pub transitions: Vec<Transition>,
    /// Executable triggers (on-chain events, time-based, oracle callbacks …).
    pub triggers: Vec<Trigger>,
    /// Actions executed when a trigger fires.
    pub actions: Vec<Action>,
    /// Inline safety-check assertions embedded in the contract source.
    pub safety_checks: Vec<SafetyCheck>,
}

// ──────────────────────────────────────────────────────────────────────────────
// States
// ──────────────────────────────────────────────────────────────────────────────

/// A named state in the contract's finite state machine.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct State {
    pub name: String,
    /// `true` if this is the initial state (exactly one must be marked initial).
    pub initial: bool,
    /// `true` for terminal / absorbing states (no outbound transitions allowed).
    pub terminal: bool,
}

// ──────────────────────────────────────────────────────────────────────────────
// Transitions
// ──────────────────────────────────────────────────────────────────────────────

/// A directed edge in the state machine.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Transition {
    pub from: String,
    pub to: String,
    /// Optional guard expression that must evaluate to `true` for the
    /// transition to fire.
    pub guard: Option<Expression>,
}

// ──────────────────────────────────────────────────────────────────────────────
// Triggers
// ──────────────────────────────────────────────────────────────────────────────

/// Events that can activate the contract logic.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum Trigger {
    /// An on-chain event emitted by a specific contract.
    OnChainEvent { contract: String, event: String },
    /// A cron-style schedule (`"every 1h"`, `"daily"`, …).
    Schedule { cron: String },
    /// A callback from an oracle or off-chain data source.
    OracleCallback { source: String, condition: Expression },
    /// A price threshold crossing (e.g. ETH/USD > 3000).
    PriceThreshold {
        pair: String,
        operator: CompareOp,
        value: f64,
    },
    /// Margin call when collateral ratio drops below `threshold`.
    MarginCall { collateral_ratio: f64 },
}

// ──────────────────────────────────────────────────────────────────────────────
// Actions
// ──────────────────────────────────────────────────────────────────────────────

/// Operations executed when a trigger fires.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum Action {
    /// Transfer `amount` of `token` from `from` to `to`.
    Transfer {
        from: String,
        to: String,
        token: String,
        amount: Expression,
    },
    /// Call a function on an external smart contract.
    ContractCall {
        contract: String,
        function: String,
        args: Vec<Expression>,
    },
    /// Emit a structured event (persisted to indexer).
    Emit { event: String, payload: Vec<(String, Expression)> },
    /// Transition to `state` unconditionally.
    Transition { state: String },
    /// Send a notification to `recipient`.
    Notify { recipient: String, message: String },
}

// ──────────────────────────────────────────────────────────────────────────────
// Safety checks
// ──────────────────────────────────────────────────────────────────────────────

/// An inline assertion that must hold at runtime.
///
/// If the condition evaluates to `false` the contract execution is halted and
/// the transaction reverted — preventing "logic-bleed" in financial flows.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SafetyCheck {
    pub id: String,
    pub condition: Expression,
    pub message: String,
}

// ──────────────────────────────────────────────────────────────────────────────
// Expressions
// ──────────────────────────────────────────────────────────────────────────────

/// A minimal expression language used in guards, amounts, and safety checks.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Expression {
    /// Integer literal.
    IntLit { value: i64 },
    /// Floating-point literal.
    FloatLit { value: f64 },
    /// String literal.
    StrLit { value: String },
    /// Boolean literal.
    BoolLit { value: bool },
    /// Reference to a named variable / parameter.
    Ident { name: String },
    /// Binary operation.
    BinOp {
        op: BinOpKind,
        left: Box<Expression>,
        right: Box<Expression>,
    },
    /// Unary negation / not.
    UnaryOp {
        op: UnaryOpKind,
        expr: Box<Expression>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum BinOpKind {
    Add,
    Sub,
    Mul,
    Div,
    Gt,
    Gte,
    Lt,
    Lte,
    Eq,
    Neq,
    And,
    Or,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum UnaryOpKind {
    Neg,
    Not,
}

/// Comparison operator (used in trigger predicates).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum CompareOp {
    Gt,
    Gte,
    Lt,
    Lte,
    Eq,
}
