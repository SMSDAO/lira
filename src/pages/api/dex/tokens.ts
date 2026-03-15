import type { NextApiRequest, NextApiResponse } from 'next';
import { DexTokenStore } from '@/models/DexToken';
import type { DexChain } from '@/models/DexToken';
import { apiLimiter } from '@/security/rateLimit';

const VALID_CHAINS: DexChain[] = ['ethereum', 'base', 'polygon', 'arbitrum', 'bnb', 'avalanche'];

function toChain(val: unknown): DexChain | undefined {
  if (typeof val === 'string' && (VALID_CHAINS as string[]).includes(val)) {
    return val as DexChain;
  }
  return undefined;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!apiLimiter(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const store = DexTokenStore.getInstance();
  const { chain, sort = 'volume', limit = '20' } = req.query;
  const parsedLimit = parseInt(limit as string, 10);
  const validLimit = Number.isFinite(parsedLimit) ? parsedLimit : 20;
  const lim = Math.min(Math.max(validLimit, 1), 100);
  const chainFilter = toChain(chain);

  const tokens =
    sort === 'liquidity'
      ? store.topByLiquidity(lim, chainFilter)
      : store.topByVolume(lim, chainFilter);

  return res.status(200).json({
    tokens,
    total: store.size(),
    chain: chain ?? 'all',
    sort,
  });
}
