/**
 * Enterprise Immutable Audit Log Vault.
 *
 * Stores a SHA-256 hash of each enterprise audit event so the event log cannot
 * be silently tampered. The hash is computed server-side using `crypto.subtle`
 * (or the Node `crypto` module as a fallback) and is Base-chain-ready: the
 * hash bytes are the same ones you would submit to an on-chain audit trail smart
 * contract (e.g. via `AuditVault.logEvent(bytes32 eventHash)`).
 *
 * In-memory store is used for development. For production, wire
 * `persistVaultEntry()` to your database or on-chain contract.
 */

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
 * Compute SHA-256 of a canonical JSON serialisation of the event.
 * The same serialisation is used for both in-memory and on-chain storage,
 * ensuring the hash is deterministic across environments.
 */
async function hashEvent(event: EnterpriseAuditEvent, recordedAt: number): Promise<string> {
  const canonical = JSON.stringify({
    action: event.action,
    userId: event.userId,
    metadata: event.metadata,
    recordedAt,
  });

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
 * Persist a vault entry to durable storage.
 * Replace this stub with a Prisma write or on-chain contract call in production.
 *
 * A warning is emitted in production when no real persistence is configured,
 * so audit events are not silently lost.
 */
async function persistVaultEntry(_entry: VaultEntry): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    // Warn operators that the in-memory vault is not production-safe.
    // Remove this warning once a real persistence layer is wired in.
    console.warn(
      '[audit-vault] WARN: persistVaultEntry is a no-op. ' +
      'Audit events are stored in memory only and will be lost on restart. ' +
      'Wire a database or on-chain contract to suppress this warning.',
    );
  }
  // No-op stub. In production replace with:
  //   await prisma.auditVaultEntry.create({ data: { hash: _entry.hash, recordedAt: new Date(_entry.recordedAt), action: _entry.action, userId: _entry.userId } });
  // or:
  //   await auditContract.logEvent(`0x${_entry.hash}`);
}
