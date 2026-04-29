/**
 * Unit tests for the shared @lira/types package.
 * Validates that the key type shapes match the expected structure.
 */

import type {
  LiraContract,
  State,
  Transition,
  Trigger,
  Action,
  SafetyCheck,
  CompileResult,
  ContractMetrics,
  WalletState,
  EditorBlock,
  EditorGraph,
  LiraNotification,
} from '@lira/types';

describe('@lira/types — type conformance', () => {
  it('LiraContract shape is correct', () => {
    const contract: LiraContract = {
      version: '1.0',
      name: 'TestContract',
      states: [],
      transitions: [],
      triggers: [],
      actions: [],
      safety_checks: [],
    };
    expect(contract.version).toBe('1.0');
    expect(contract.name).toBe('TestContract');
  });

  it('State shape is correct', () => {
    const state: State = { name: 'Open', initial: true, terminal: false };
    expect(state.initial).toBe(true);
  });

  it('Transition shape is correct', () => {
    const t: Transition = { from: 'Open', to: 'Closed', guard: undefined };
    expect(t.from).toBe('Open');
  });

  it('Trigger variants are valid', () => {
    const triggers: Trigger[] = [
      { kind: 'on_chain_event', contract: '0xABCD', event: 'Transfer' },
      { kind: 'schedule', cron: '0 * * * *' },
      { kind: 'margin_call', collateral_ratio: 1.5 },
      { kind: 'price_threshold', pair: 'ETH/USD', operator: 'gt', value: 3000 },
    ];
    expect(triggers).toHaveLength(4);
  });

  it('Action variants are valid', () => {
    const actions: Action[] = [
      {
        kind: 'transfer',
        from: 'sender',
        to: 'receiver',
        token: 'USDC',
        amount: { type: 'int_lit', value: 100 },
      },
      { kind: 'notify', recipient: 'alice', message: 'Done' },
      { kind: 'transition', state: 'Closed' },
    ];
    expect(actions).toHaveLength(3);
  });

  it('SafetyCheck shape is correct', () => {
    const check: SafetyCheck = {
      id: 'non_zero',
      condition: { type: 'bool_lit', value: true },
      message: 'must be non-zero',
    };
    expect(check.id).toBe('non_zero');
  });

  it('CompileResult success shape is correct', () => {
    const contract: LiraContract = {
      version: '1.0', name: 'T', states: [], transitions: [],
      triggers: [], actions: [], safety_checks: [],
    };
    const result: CompileResult = {
      ok: true,
      contract,
      json: '{}',
      warnings: [],
    };
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.contract).toBe(contract);
    }
  });

  it('CompileResult failure shape is correct', () => {
    const result: CompileResult = {
      ok: false,
      errors: ['Undefined state "Ghost"'],
    };
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(1);
    }
  });

  it('ContractMetrics shape is correct', () => {
    const metrics: ContractMetrics = {
      address: '0x1234567890123456789012345678901234567890',
      name: 'Vault',
      status: 'active',
      apy: 12.5,
      tvl: 1_000_000n,
      riskScore: 30,
      riskLevel: 'low',
      lastExecution: new Date(),
      chainId: 84532,
    };
    expect(metrics.riskLevel).toBe('low');
    expect(metrics.tvl).toBe(1_000_000n);
  });

  it('WalletState shape is correct', () => {
    const wallet: WalletState = {
      address: null,
      balance: 0n,
      balanceUsd: 0,
      pendingTx: [],
      biometricEnabled: false,
      connected: false,
    };
    expect(wallet.connected).toBe(false);
  });

  it('EditorGraph shape is correct', () => {
    const block: EditorBlock = {
      id: 'b1',
      kind: 'state',
      label: 'Open',
      props: { initial: true },
      position: { x: 0, y: 0 },
    };
    const graph: EditorGraph = {
      blocks: [block],
      connections: [['b1', 'b2']],
    };
    expect(graph.blocks).toHaveLength(1);
    expect(graph.connections[0]).toEqual(['b1', 'b2']);
  });

  it('LiraNotification shape is correct', () => {
    const n: LiraNotification = {
      id: 'n1',
      kind: 'contract_executed',
      title: 'Contract Executed',
      body: 'Your contract has been executed',
      timestamp: new Date(),
      read: false,
    };
    expect(n.kind).toBe('contract_executed');
  });
});
