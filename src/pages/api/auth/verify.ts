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
 * POST /api/auth/verify – verifies a SIWE signature and issues a session.
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

  const session = {
    address,
    chainId: 8453,
    signedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    nonce: Math.random().toString(36).slice(2),
  };

  const validation = validateWalletSession(session);
  if (!validation.valid) {
    return res.status(401).json({ error: validation.reason });
  }

  auditLog.record({ action: 'auth.login', actor: address, ip: req.headers['x-forwarded-for'] as string });

  return res.status(200).json({ session, authenticated: true });
}
