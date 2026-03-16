/**
 * DEX Scanner – indexes liquidity pools across major decentralised exchanges.
 *
 * Uses public subgraph / REST APIs to fetch pool and token data.
 * Results are stored in the DexTokenStore singleton.
 *
 * Supported protocols: Uniswap v2/v3, SushiSwap, PancakeSwap, Curve,
 * Balancer, GMX (extendable).
 */

import type { DexChain, DexProtocol, DexToken, DexPool } from '@/models/DexToken';
import { DexTokenStore } from '@/models/DexToken';

// ---------------------------------------------------------------------------
// Subgraph endpoints (public – no API keys required for basic queries)
// ---------------------------------------------------------------------------

const ENDPOINTS: Record<string, string> = {
  uniswap_v3_ethereum:
    'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
  uniswap_v3_base:
    'https://api.studio.thegraph.com/query/48211/uniswap-v3-base/v0.0.2',
  sushiswap_ethereum:
    'https://api.thegraph.com/subgraphs/name/sushi-v2/sushiswap-ethereum',
  pancakeswap_bnb:
    'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v2',
};

// ---------------------------------------------------------------------------
// GraphQL helpers
// ---------------------------------------------------------------------------

const TOP_POOLS_QUERY = `
  query TopPools($first: Int!) {
    pools(first: $first, orderBy: volumeUSD, orderDirection: desc) {
      id
      token0 { id symbol name decimals }
      token1 { id symbol name decimals }
      feeTier
      totalValueLockedUSD
      volumeUSD
    }
  }
`;

interface SubgraphPool {
  id: string;
  token0: { id: string; symbol: string; name: string; decimals: string };
  token1: { id: string; symbol: string; name: string; decimals: string };
  feeTier?: string;
  totalValueLockedUSD: string;
  volumeUSD: string;
}

interface SubgraphResponse {
  data?: { pools?: SubgraphPool[] };
  errors?: Array<{ message: string }>;
}

async function querySubgraph(
  endpoint: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<SubgraphResponse | null> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as SubgraphResponse;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Scanner
// ---------------------------------------------------------------------------

export interface ScanResult {
  protocol: DexProtocol;
  chain: DexChain;
  poolsDiscovered: number;
  tokensUpserted: number;
  errors: string[];
  durationMs: number;
}

async function scanEndpoint(
  key: string,
  endpoint: string,
  protocol: DexProtocol,
  chain: DexChain,
  limit = 50,
): Promise<ScanResult> {
  const start = Date.now();
  const result: ScanResult = {
    protocol,
    chain,
    poolsDiscovered: 0,
    tokensUpserted: 0,
    errors: [],
    durationMs: 0,
  };

  const response = await querySubgraph(endpoint, TOP_POOLS_QUERY, { first: limit });
  if (!response || !response.data?.pools) {
    result.errors.push(`${key}: no data returned`);
    result.durationMs = Date.now() - start;
    return result;
  }

  const store = DexTokenStore.getInstance();
  const pools: SubgraphPool[] = response.data.pools;
  result.poolsDiscovered = pools.length;

  const now = Date.now();
  const tokenMap = new Map<string, DexToken>();

  for (const pool of pools) {
    const liquidity = parseFloat(pool.totalValueLockedUSD) || 0;
    const volume = parseFloat(pool.volumeUSD) || 0;

    const dexPool: DexPool = {
      address: pool.id,
      protocol,
      chain,
      token0Address: pool.token0.id,
      token0Symbol: pool.token0.symbol,
      token1Address: pool.token1.id,
      token1Symbol: pool.token1.symbol,
      feeTier: pool.feeTier ? parseInt(pool.feeTier, 10) : undefined,
      liquidityUsd: liquidity,
      // volumeUSD from the subgraph is cumulative all-time, not 24h
      volumeTotalUsd: volume,
      createdAt: now,
    };

    // Update token0
    const t0key = `${chain}:${pool.token0.id.toLowerCase()}`;
    const existing0 = tokenMap.get(t0key) ?? store.get(chain, pool.token0.id) ?? {
      address: pool.token0.id,
      chain,
      symbol: pool.token0.symbol,
      name: pool.token0.name,
      decimals: parseInt(pool.token0.decimals, 10) || 18,
      priceUsd: 0,
      priceChange24h: 0,
      volumeTotalUsd: 0,
      totalLiquidityUsd: 0,
      pools: [],
      priceHistory: [],
      verified: false,
      tags: [],
      firstSeenAt: now,
      lastUpdatedAt: now,
    } as DexToken;

    existing0.pools = [...existing0.pools.filter(p => p.address !== dexPool.address), dexPool];
    existing0.totalLiquidityUsd = existing0.pools.reduce((s, p) => s + p.liquidityUsd, 0);
    existing0.volumeTotalUsd = existing0.pools.reduce((s, p) => s + p.volumeTotalUsd, 0);
    tokenMap.set(t0key, existing0);

    // Update token1
    const t1key = `${chain}:${pool.token1.id.toLowerCase()}`;
    const existing1 = tokenMap.get(t1key) ?? store.get(chain, pool.token1.id) ?? {
      address: pool.token1.id,
      chain,
      symbol: pool.token1.symbol,
      name: pool.token1.name,
      decimals: parseInt(pool.token1.decimals, 10) || 18,
      priceUsd: 0,
      priceChange24h: 0,
      volumeTotalUsd: 0,
      totalLiquidityUsd: 0,
      pools: [],
      priceHistory: [],
      verified: false,
      tags: [],
      firstSeenAt: now,
      lastUpdatedAt: now,
    } as DexToken;

    existing1.pools = [...existing1.pools.filter(p => p.address !== dexPool.address), dexPool];
    existing1.totalLiquidityUsd = existing1.pools.reduce((s, p) => s + p.liquidityUsd, 0);
    existing1.volumeTotalUsd = existing1.pools.reduce((s, p) => s + p.volumeTotalUsd, 0);
    tokenMap.set(t1key, existing1);
  }

  for (const token of tokenMap.values()) {
    store.upsert(token);
    result.tokensUpserted++;
  }

  result.durationMs = Date.now() - start;
  return result;
}

/** Run a full DEX scan across all configured endpoints. */
export async function runDexScan(limit = 50): Promise<ScanResult[]> {
  const jobs: Array<Promise<ScanResult>> = [
    scanEndpoint('uniswap_v3_ethereum', ENDPOINTS.uniswap_v3_ethereum, 'uniswap_v3', 'ethereum', limit),
    scanEndpoint('uniswap_v3_base', ENDPOINTS.uniswap_v3_base, 'uniswap_v3', 'base', limit),
    scanEndpoint('sushiswap_ethereum', ENDPOINTS.sushiswap_ethereum, 'sushiswap', 'ethereum', limit),
    scanEndpoint('pancakeswap_bnb', ENDPOINTS.pancakeswap_bnb, 'pancakeswap', 'bnb', limit),
  ];

  return Promise.all(jobs);
}
