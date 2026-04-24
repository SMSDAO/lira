/**
 * @lira/types — Shared TypeScript type library for the Lira Protocol ecosystem.
 *
 * Every module (web, mobile, core-engine FFI, indexer) imports from this
 * package to ensure type safety across module boundaries.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Core DSL / AST
// ──────────────────────────────────────────────────────────────────────────────

export type HexAddress = `0x${string}`;

export type CompareOp = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';

export type BinOpKind =
  | 'add' | 'sub' | 'mul' | 'div'
  | 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq'
  | 'and' | 'or';

export type UnaryOpKind = 'neg' | 'not';

export type Expression =
  | { type: 'int_lit';   value: number }
  | { type: 'float_lit'; value: number }
  | { type: 'str_lit';   value: string }
  | { type: 'bool_lit';  value: boolean }
  | { type: 'ident';     name: string }
  | { type: 'bin_op';    op: BinOpKind; left: Expression; right: Expression }
  | { type: 'unary_op';  op: UnaryOpKind; expr: Expression };

export interface State {
  name: string;
  initial: boolean;
  terminal: boolean;
}

export interface Transition {
  from: string;
  to: string;
  guard?: Expression;
}

export type Trigger =
  | { kind: 'on_chain_event';  contract: string; event: string }
  | { kind: 'schedule';        cron: string }
  | { kind: 'oracle_callback'; source: string; condition: Expression }
  | { kind: 'price_threshold'; pair: string; operator: CompareOp; value: number }
  | { kind: 'margin_call';     collateral_ratio: number };

export type Action =
  | { kind: 'transfer';      from: string; to: string; token: string; amount: Expression }
  | { kind: 'contract_call'; contract: string; function: string; args: Expression[] }
  | { kind: 'emit';          event: string; payload: Array<[string, Expression]> }
  | { kind: 'transition';    state: string }
  | { kind: 'notify';        recipient: string; message: string };

export interface SafetyCheck {
  id: string;
  condition: Expression;
  message: string;
}

/** Top-level Lira contract AST — mirrors the Rust `LiraContract` struct. */
export interface LiraContract {
  version: string;
  name: string;
  states: State[];
  transitions: Transition[];
  triggers: Trigger[];
  actions: Action[];
  safety_checks: SafetyCheck[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Compiler result types (mirroring core-engine output)
// ──────────────────────────────────────────────────────────────────────────────

export interface CompileOptions {
  /** Reject contracts with undefined states when true (Safety-First flag). */
  safety_first: boolean;
}

export interface CompileSuccess {
  ok: true;
  contract: LiraContract;
  /** Canonical JSON serialisation of the contract. */
  json: string;
  warnings: string[];
}

export interface CompileFailure {
  ok: false;
  errors: string[];
}

export type CompileResult = CompileSuccess | CompileFailure;

// ──────────────────────────────────────────────────────────────────────────────
// Registry / TradeOS dashboard
// ──────────────────────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ContractStatus = 'active' | 'paused' | 'expired' | 'liquidated';

export interface ContractMetrics {
  address: HexAddress;
  name: string;
  status: ContractStatus;
  /** Annual percentage yield (0–∞). */
  apy: number;
  /** Total value locked in USD. */
  tvl: bigint;
  /** Risk score 0–100. */
  riskScore: number;
  riskLevel: RiskLevel;
  lastExecution: Date;
  chainId: number;
}

export interface TradeOSContract {
  address: HexAddress;
  name: string;
  owner: HexAddress;
  deployedAt: Date;
  liraSource: string;
  metrics: ContractMetrics;
}

// ──────────────────────────────────────────────────────────────────────────────
// Mobile wallet
// ──────────────────────────────────────────────────────────────────────────────

export interface Transaction {
  hash: HexAddress;
  from: HexAddress;
  to: HexAddress;
  value: bigint;
  token: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
}

export interface WalletState {
  address: HexAddress | null;
  balance: bigint;
  /** USD value of the wallet's holdings. */
  balanceUsd: number;
  pendingTx: Transaction[];
  biometricEnabled: boolean;
  connected: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// Real-time notifications (WebSocket events)
// ──────────────────────────────────────────────────────────────────────────────

export type NotificationKind =
  | 'contract_executed'
  | 'margin_call'
  | 'price_alert'
  | 'tx_confirmed'
  | 'tx_failed';

export interface LiraNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  contractAddress?: HexAddress;
  timestamp: Date;
  read: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// Visual editor (drag-and-drop DSL builder)
// ──────────────────────────────────────────────────────────────────────────────

export type EditorBlockKind =
  | 'state'
  | 'transition'
  | 'trigger'
  | 'action'
  | 'safety_check';

export interface EditorBlock {
  id: string;
  kind: EditorBlockKind;
  label: string;
  /** JSON-serialisable properties specific to the block kind. */
  props: Record<string, unknown>;
  /** Canvas position. */
  position: { x: number; y: number };
}

export interface EditorGraph {
  blocks: EditorBlock[];
  /** Edge: [sourceBlockId, targetBlockId]. */
  connections: Array<[string, string]>;
}

// ──────────────────────────────────────────────────────────────────────────────
// API SDK request / response helpers
// ──────────────────────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
  code?: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
