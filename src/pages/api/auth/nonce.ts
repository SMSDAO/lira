import type { NextApiRequest, NextApiResponse } from 'next';
import { generateNonce, storeNonce } from '@/auth/wallet';
import { authLimiter } from '@/security/rateLimit';

/**
 * GET /api/auth/nonce – returns a one-time nonce for SIWE message construction.
 * The nonce is stored server-side and must be included in the SIWE message
 * submitted to POST /api/auth/verify within 30 minutes.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!authLimiter(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const nonce = generateNonce();
  storeNonce(nonce);
  return res.status(200).json({ nonce });
}
