/**
 * TimelineEvent model – tracks every meaningful action that happens in the
 * Lira platform, from user interactions to on-chain events.
 */

export type TimelineEventType =
  // User actions
  | 'user.login'
  | 'user.logout'
  | 'user.profile_update'
  | 'user.wallet_connect'
  | 'user.wallet_disconnect'
  | 'user.api_key_created'
  | 'user.api_key_revoked'
  // Wallet activity
  | 'wallet.transfer'
  | 'wallet.nft_mint'
  | 'wallet.nft_transfer'
  | 'wallet.contract_call'
  // DEX activity
  | 'dex.scan_started'
  | 'dex.scan_completed'
  | 'dex.token_discovered'
  | 'dex.pool_updated'
  // Agent tasks
  | 'agent.started'
  | 'agent.completed'
  | 'agent.failed'
  | 'agent.paused'
  // Contract calls
  | 'contract.deploy'
  | 'contract.call'
  | 'contract.event'
  // System alerts
  | 'system.alert'
  | 'system.health_check'
  | 'system.maintenance'
  // Admin actions
  | 'admin.user_ban'
  | 'admin.user_unban'
  | 'admin.api_key_revoke'
  | 'admin.feature_toggle'
  | 'admin.agent_pause';

export type TimelineEventSeverity = 'info' | 'warning' | 'error' | 'success';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  severity: TimelineEventSeverity;
  /** The user this event belongs to, or null for system events */
  userId?: string;
  /** Wallet address associated with the event */
  walletAddress?: string;
  /** Human-readable event title */
  title: string;
  /** Additional detail */
  description?: string;
  /** Arbitrary metadata for the event */
  metadata?: Record<string, unknown>;
  /** Transaction hash for on-chain events */
  txHash?: string;
  /** Block number for on-chain events */
  blockNumber?: number;
  /** Chain identifier */
  chain?: string;
  createdAt: number; // Unix ms
}

// ---------------------------------------------------------------------------
// Simple in-process ring-buffer store (max 10 000 events per node)
// ---------------------------------------------------------------------------

const MAX_EVENTS = 10_000;

export class TimelineStore {
  private static instance: TimelineStore;
  private events: TimelineEvent[] = [];

  static getInstance(): TimelineStore {
    if (!TimelineStore.instance) {
      TimelineStore.instance = new TimelineStore();
    }
    return TimelineStore.instance;
  }

  add(event: Omit<TimelineEvent, 'id' | 'createdAt'>): TimelineEvent {
    const full: TimelineEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    this.events.unshift(full);
    if (this.events.length > MAX_EVENTS) {
      this.events.pop();
    }
    return full;
  }

  list(options?: {
    userId?: string;
    type?: TimelineEventType;
    severity?: TimelineEventSeverity;
    limit?: number;
    offset?: number;
  }): TimelineEvent[] {
    let filtered = [...this.events];
    if (options?.userId) filtered = filtered.filter(e => e.userId === options.userId);
    if (options?.type) filtered = filtered.filter(e => e.type === options.type);
    if (options?.severity) filtered = filtered.filter(e => e.severity === options.severity);
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    return filtered.slice(offset, offset + limit);
  }

  total(): number {
    return this.events.length;
  }
}
