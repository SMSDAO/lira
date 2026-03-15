import type { NextApiRequest, NextApiResponse } from 'next';
import { runDexScan } from '@/dex/scanner';
import { strictLimiter } from '@/security/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!strictLimiter(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = await runDexScan(50);

  return res.status(200).json({
    results,
    totalProtocols: results.length,
    totalTokens: results.reduce((s, r) => s + r.tokensUpserted, 0),
    totalPools: results.reduce((s, r) => s + r.poolsDiscovered, 0),
  });
}
