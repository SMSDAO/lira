import type { NextApiRequest, NextApiResponse } from 'next';
import { generateNonce } from '@/auth/wallet';
import { authLimiter } from '@/security/rateLimit';

/**
 * GET /api/auth/nonce – returns a one-time nonce for SIWE message construction.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!authLimiter(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const nonce = generateNonce();
  return res.status(200).json({ nonce });
}
