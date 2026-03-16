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

  // Normalize query params – req.query values can be string | string[]
  const rawChain = Array.isArray(req.query.chain) ? req.query.chain[0] : req.query.chain;
  const rawSort = Array.isArray(req.query.sort)
    ? (req.query.sort[0] ?? 'volume')
    : (req.query.sort ?? 'volume');
  const rawLimit = Array.isArray(req.query.limit)
    ? (req.query.limit[0] ?? '20')
    : (req.query.limit ?? '20');

  const parsedLimit = parseInt(rawLimit as string, 10);
  const validLimit = Number.isFinite(parsedLimit) ? parsedLimit : 20;
  const lim = Math.min(Math.max(validLimit, 1), 100);
  const chainFilter = toChain(rawChain);

  const tokens =
    rawSort === 'liquidity'
      ? store.topByLiquidity(lim, chainFilter)
      : store.topByVolume(lim, chainFilter);

  return res.status(200).json({
    tokens,
    total: store.size(),
    chain: chainFilter ?? 'all',
    sort: rawSort,
  });
}
