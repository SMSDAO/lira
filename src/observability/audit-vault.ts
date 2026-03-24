/**
 * Enterprise Immutable Audit Log Vault.
 *
 * Stores a SHA-256 hash of each enterprise audit event so the event log cannot
 * be silently tampered. The hash is computed server-side using `crypto.subtle`
 * (or the Node `crypto` module as a fallback) and is Base-chain-ready: the
 * hash bytes are the same ones you would submit to an on-chain audit trail smart
 * contract (e.g. via `AuditVault.logEvent(bytes32 eventHash)`).
 *
 * In-memory store is kept for fast reads within a single process. Each event is
 * also persisted to the `audit_vault_entries` database table via Prisma so the
 * audit log survives restarts.
 */

import prisma from '@/lib/prisma';

export interface EnterpriseAuditEvent {
  /** Short action identifier, e.g. "USER_LOGIN", "TOKEN_MINT" */
  action: string;
  /** Lira platform user ID or wallet address */
  userId: string;
  /** Arbitrary metadata payload */
  metadata: unknown;
}

export interface VaultEntry {
  /** Deterministic event hash (SHA-256, hex-encoded) */
  hash: string;
  /** Unix ms timestamp of when the event was recorded */
  recordedAt: number;
  /** Action identifier (kept for local lookup only – not stored on-chain) */
  action: string;
  /** User identifier (kept for local lookup only – not stored on-chain) */
  userId: string;
}

/** In-memory vault – replace with DB/contract writes in production. */
const vault: VaultEntry[] = [];

/**
 * Recursively sort object keys so that `JSON.stringify` produces a
 * deterministic / canonical string regardless of insertion order.
 */
function sortedKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortedKeys);
  if (value !== null && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortedKeys((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}

/**
 * Compute SHA-256 of a canonical JSON serialisation of the event.
 * Keys are recursively sorted before stringification so the hash is
 * deterministic across callers/environments regardless of object-key
 * insertion order in `metadata`.
 */
async function hashEvent(event: EnterpriseAuditEvent, recordedAt: number): Promise<string> {
  const canonical = JSON.stringify(sortedKeys({
    action: event.action,
    userId: event.userId,
    metadata: event.metadata,
    recordedAt,
  }));

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const bytes = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(canonical),
    );
    // Use Uint8Array for runtime-agnostic hex encoding (no Buffer dependency)
    return Array.from(new Uint8Array(bytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Node.js fallback
  const { createHash } = await import('crypto');
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Record an enterprise audit event.
 *
 * Returns the vault entry (including the computed hash) so callers can
 * optionally submit the hash to an on-chain contract.
 *
 * @example
 * ```ts
 * const entry = await logEnterpriseEvent({
 *   action: 'USER_LOGIN',
 *   userId: '0xabc…',
 *   metadata: { ip: req.socket.remoteAddress, userAgent: req.headers['user-agent'] },
 * });
 * // optionally: await auditContract.logEvent(`0x${entry.hash}`);
 * ```
 */
export async function logEnterpriseEvent(event: EnterpriseAuditEvent): Promise<VaultEntry> {
  const recordedAt = Date.now();
  const hash = await hashEvent(event, recordedAt);

  const entry: VaultEntry = {
    hash,
    recordedAt,
    action: event.action,
    userId: event.userId,
  };

  vault.push(entry);

  // Hook for production persistence (no-op stub)
  await persistVaultEntry(entry);

  return entry;
}

/**
 * Retrieve recent vault entries (most recent first).
 * This is a diagnostic helper; on-chain entries are the authoritative source.
 */
export function getRecentVaultEntries(limit = 100): VaultEntry[] {
  return vault.slice(-limit).reverse();
}

/**
 * Persist a vault entry to durable storage via Prisma.
 * Falls back to an in-memory-only warning if the database is unavailable.
 */
async function persistVaultEntry(entry: VaultEntry): Promise<void> {
  try {
    await prisma.auditVaultEntry.create({
      data: {
        hash: entry.hash,
        action: entry.action,
        userId: entry.userId,
        recordedAt: new Date(entry.recordedAt),
      },
    });
  } catch (err) {
    // Log but do not throw – a DB write failure should not prevent the
    // in-memory vault from capturing the event for the current process.
    console.error('[audit-vault] Failed to persist vault entry to database:', err);
  }
}
