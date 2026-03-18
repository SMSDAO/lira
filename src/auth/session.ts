/**
 * Shared lira_session cookie verification helper.
 *
 * Used by any server-side code that needs to authenticate or authorise a
 * request based on the signed session cookie issued by /api/auth/verify.
 *
 * Token format: base64url(JSON payload) . base64url(HMAC-SHA256)
 *
 * The role returned by `verifySession` is derived server-side from the
 * payload's `address` field using the admin/dev allow-lists; the payload does
 * NOT carry a role claim to prevent privilege escalation via a forged cookie.
 */

import { timingSafeEqual, createHmac } from 'crypto';
import type { NextApiRequest } from 'next';
import { serverConfig } from '@/config/server';
import { config } from '@/config';

export interface VerifiedSession {
  /** Verified wallet address from the session payload */
  address: string;
  /** Session expiry (Unix ms) */
  expiresAt: number;
  /** Role derived from address allow-lists: 'admin' | 'developer' | 'user' */
  role: string;
}

/**
 * Parse, HMAC-verify, and decode the `lira_session` cookie from `req`.
 *
 * Returns the verified session on success, or `null` if the cookie is absent,
 * structurally invalid, has an invalid signature, or has expired.
 *
 * The HMAC comparison is performed with `crypto.timingSafeEqual` to prevent
 * timing-based forgery attacks.
 */
export async function verifySession(req: NextApiRequest): Promise<VerifiedSession | null> {
  const cookieHeader = req.headers.cookie ?? '';
  const match = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('lira_session='));
  if (!match) return null;

  // Cookie values may contain '=' for other reasons – preserve all after the first '='
  const tokenRaw = match.split('=').slice(1).join('=');
  if (!tokenRaw) return null;

  // Token format: base64url(JSON payload) . base64url(HMAC)
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
  if (providedSig.length !== expectedSig.length) return null;
  if (!timingSafeEqual(providedSig, expectedSig)) return null;

  try {
    const payload = JSON.parse(payloadStr) as {
      address?: string;
      expiresAt?: number;
    };
    if (!payload.address || typeof payload.expiresAt !== 'number') return null;
    if (Date.now() > payload.expiresAt) return null;

    // Derive role server-side from address allow-lists (no role claim in token)
    const addr = payload.address.toLowerCase();
    let role: string;
    if (config.adminAddresses.includes(addr)) {
      role = 'admin';
    } else if (config.devAddresses.includes(addr)) {
      role = 'developer';
    } else {
      role = 'user';
    }

    return { address: payload.address, expiresAt: payload.expiresAt, role };
  } catch {
    return null;
  }
}
