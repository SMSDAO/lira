/**
 * Audit log – append-only record of privileged actions.
 * In production this should be persisted to a database or SIEM system.
 */

export type AuditAction =
  | 'user.ban'
  | 'user.unban'
  | 'user.role_change'
  | 'api_key.revoke'
  | 'wallet.disable'
  | 'feature_flag.toggle'
  | 'agent.pause'
  | 'agent.resume'
  | 'rate_limit.change'
  | 'contract.call'
  | 'system.maintenance'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed';

export interface AuditEntry {
  id: string;
  action: AuditAction;
  /** Who performed the action (wallet address or email) */
  actor: string;
  /** The subject of the action (user ID, contract address, etc.) */
  subject?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: number; // Unix ms
}

const MAX_ENTRIES = 50_000;

export class AuditLog {
  private static instance: AuditLog;
  private entries: AuditEntry[] = [];

  static getInstance(): AuditLog {
    if (!AuditLog.instance) {
      AuditLog.instance = new AuditLog();
    }
    return AuditLog.instance;
  }

  record(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const full: AuditEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    this.entries.unshift(full);
    if (this.entries.length > MAX_ENTRIES) this.entries.pop();
    return full;
  }

  list(options?: {
    actor?: string;
    action?: AuditAction;
    limit?: number;
    offset?: number;
  }): AuditEntry[] {
    let filtered = [...this.entries];
    if (options?.actor) filtered = filtered.filter(e => e.actor === options.actor);
    if (options?.action) filtered = filtered.filter(e => e.action === options.action);
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    return filtered.slice(offset, offset + limit);
  }

  total(): number {
    return this.entries.length;
  }
}

export const auditLog = AuditLog.getInstance();
