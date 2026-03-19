import type { NextApiRequest, NextApiResponse } from 'next';
import { runDexScan } from '@/dex/scanner';
import { strictLimiter } from '@/security/rateLimit';
import { config } from '@/config';
import { verifySession } from '@/auth/session';

const SCAN_ALLOWED_ROLES = new Set(['admin', 'developer']);

/**
 * In-memory scan dedup guard.
 * NOTE: This flag is per-process only. In multi-instance / serverless deployments
 * each instance has independent memory, so concurrent scans across instances are
 * still possible. For distributed dedup, use a Redis SETNX lock with a TTL.
 */
let scanInProgress = false;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!strictLimiter(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Feature-flag guard
  if (!config.features.dexScanner) {
    return res.status(403).json({ error: 'DEX scanner is disabled' });
  }

  // Auth guard – only admin/developer roles may trigger full scans (HMAC-verified)
  const session = await verifySession(req);
  if (!session) {
    return res.status(401).json({ error: 'A valid session is required to trigger a scan' });
  }
  if (!SCAN_ALLOWED_ROLES.has(session.role)) {
    return res.status(403).json({ error: 'Admin or developer role required to trigger a scan' });
  }

  // Dedup guard – reject concurrent scans within the same process instance
  if (scanInProgress) {
    return res.status(409).json({ error: 'A scan is already in progress; please retry shortly' });
  }

  scanInProgress = true;
  try {
    const results = await runDexScan(50);
    return res.status(200).json({
      results,
      totalProtocols: results.length,
      totalTokens: results.reduce((s, r) => s + r.tokensUpserted, 0),
      totalPools: results.reduce((s, r) => s + r.poolsDiscovered, 0),
    });
  } finally {
    scanInProgress = false;
  }
}
