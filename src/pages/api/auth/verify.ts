import type { NextApiRequest, NextApiResponse } from 'next';
import { verifySiweSignature } from '@/wasm/crypto';
import { validateWalletSession } from '@/auth/wallet';
import { authLimiter } from '@/security/rateLimit';
import { validateBody } from '@/security/requestValidation';
import { auditLog } from '@/security/audit';

const schema = {
  message: { type: 'string' as const, required: true },
  signature: { type: 'string' as const, required: true },
  address: { type: 'address' as const, required: true },
};

/**
 * Sign a session payload using HMAC-SHA256 with SESSION_SECRET.
 * Returns a base64url-encoded token that can be verified server-side.
 * Only runs in Node.js environments (not Edge).
 */
async function signSessionToken(payload: Record<string, unknown>): Promise<string> {
  const secret = process.env.SESSION_SECRET ?? 'dev-secret-change-in-production';
  const data = JSON.stringify(payload);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.${b64}`;
  }

  // Node.js fallback
  const { createHmac } = await import('crypto');
  const mac = createHmac('sha256', secret).update(data).digest('base64url');
  return `${Buffer.from(data).toString('base64url')}.${mac}`;
}

/**
 * POST /api/auth/verify – verifies a SIWE signature and issues a signed session token.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!authLimiter(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!validateBody(schema)(req, res)) return;

  const { message, signature, address } = req.body as {
    message: string;
    signature: string;
    address: string;
  };

  const result = await verifySiweSignature(message, signature, address);

  if (!result.valid) {
    auditLog.record({ action: 'auth.failed', actor: address, ip: req.headers['x-forwarded-for'] as string });
    return res.status(401).json({ error: 'Invalid signature', detail: result.error });
  }

  const sessionPayload = {
    address,
    chainId: 8453,
    signedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };

  const validation = validateWalletSession({ ...sessionPayload, nonce: '' });
  if (!validation.valid) {
    return res.status(401).json({ error: validation.reason });
  }

  auditLog.record({ action: 'auth.login', actor: address, ip: req.headers['x-forwarded-for'] as string });

  const token = await signSessionToken(sessionPayload);

  // Issue the session token as an HttpOnly cookie so it cannot be read by JS
  const isProduction = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    [
      `lira_session=${token}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      `Max-Age=${24 * 60 * 60}`,
      ...(isProduction ? ['Secure'] : []),
    ].join('; '),
  );

  return res.status(200).json({ authenticated: true, expiresAt: sessionPayload.expiresAt });
}
