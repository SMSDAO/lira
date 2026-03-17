import type { NextApiRequest, NextApiResponse } from 'next';
import { timingSafeEqual, createHmac } from 'crypto';
import { runDexScan } from '@/dex/scanner';
import { strictLimiter } from '@/security/rateLimit';
import { config } from '@/config';
import { serverConfig } from '@/config/server';

/**
 * Extract, HMAC-verify the lira_session cookie, and derive the role from the
 * session address using the admin/dev allow-lists.
 *
 * The session token payload includes `address` but not a `role` claim (role is
 * derived server-side to prevent privilege escalation via a forged cookie).
 */
async function getVerifiedSessionRole(req: NextApiRequest): Promise<string | null> {
  const cookieHeader = req.headers.cookie ?? '';
  const match = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('lira_session='));
  if (!match) return null;

  const tokenRaw = match.split('=').slice(1).join('=');
  if (!tokenRaw) return null;

  const dotIdx = tokenRaw.indexOf('.');
  if (dotIdx === -1) return null;
  const payloadB64 = tokenRaw.slice(0, dotIdx);
  const sigB64 = tokenRaw.slice(dotIdx + 1);
  if (!payloadB64 || !sigB64) return null;

  const secret = serverConfig.sessionSecret;
  const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
  let expectedSig: Buffer;
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      );
      const sigBytes = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(payloadStr),
      );
      expectedSig = Buffer.from(sigBytes);
    } else {
      expectedSig = createHmac('sha256', secret).update(payloadStr).digest();
    }
  } catch {
    return null;
  }

  const providedSig = Buffer.from(sigB64, 'base64url');
  // Use timingSafeEqual to prevent timing-based HMAC forgery attacks
  if (providedSig.length !== expectedSig.length) return null;
  if (!timingSafeEqual(providedSig, expectedSig)) return null;

  try {
    const payload = JSON.parse(payloadStr) as { address?: string; expiresAt?: number };
    if (typeof payload.expiresAt !== 'number' || Date.now() > payload.expiresAt) return null;
    if (!payload.address) return null;

    // Derive role from address – the session payload does not include a role claim
    // to prevent privilege escalation via a crafted cookie.
    const addr = payload.address.toLowerCase();
    if (config.adminAddresses.includes(addr)) return 'admin';
    if (config.devAddresses.includes(addr)) return 'developer';
    return 'user';
  } catch {
    return null;
  }
}

const SCAN_ALLOWED_ROLES = new Set(['admin', 'super-admin', 'developer']);

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
  const role = await getVerifiedSessionRole(req);
  if (!role || !SCAN_ALLOWED_ROLES.has(role)) {
    return res.status(401).json({ error: 'Admin or developer session required to trigger a scan' });
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
