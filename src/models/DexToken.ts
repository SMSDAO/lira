/**
 * DexToken model – stores on-chain analytics for tokens discovered by the
 * DEX scanner agent across Uniswap, SushiSwap, PancakeSwap, Curve,
 * Balancer, and GMX.
 */

export type DexProtocol =
  | 'uniswap_v2'
  | 'uniswap_v3'
  | 'sushiswap'
  | 'pancakeswap'
  | 'curve'
  | 'balancer'
  | 'gmx'
  | 'unknown';

export type DexChain = 'ethereum' | 'base' | 'polygon' | 'arbitrum' | 'bnb' | 'avalanche';

export interface DexPricePoint {
  timestamp: number; // Unix ms
  priceUsd: number;
  volume24h: number;
}

export interface DexPool {
  address: string;
  protocol: DexProtocol;
  chain: DexChain;
  token0Address: string;
  token0Symbol: string;
  token1Address: string;
  token1Symbol: string;
  feeTier?: number; // basis points (e.g. 3000 = 0.3%)
  liquidityUsd: number;
  volume24h: number;
  apr?: number;
  createdAt: number; // Unix ms
}

export interface DexToken {
  /** Contract address (checksummed) */
  address: string;
  chain: DexChain;
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
  /** Current price in USD */
  priceUsd: number;
  /** 24-hour price change as a decimal fraction (e.g. 0.05 = +5%) */
  priceChange24h: number;
  /** Market capitalisation in USD */
  marketCapUsd?: number;
  /** Fully diluted valuation in USD */
  fdvUsd?: number;
  /** Total supply */
  totalSupply?: string;
  /** Circulating supply */
  circulatingSupply?: string;
  /** Aggregated 24-h trading volume across all indexed pools */
  volume24h: number;
  /** Total value locked across all indexed pools */
  totalLiquidityUsd: number;
  /** All pools in which this token participates */
  pools: DexPool[];
  /** Historical price snapshots */
  priceHistory: DexPricePoint[];
  /** Whether the token has been verified / not a honeypot */
  verified: boolean;
  /** Tags for filtering (e.g. "stablecoin", "lp", "governance") */
  tags: string[];
  firstSeenAt: number; // Unix ms
  lastUpdatedAt: number; // Unix ms
}

// ---------------------------------------------------------------------------
// In-memory store (used by the DEX scanner agent between DB flushes)
// ---------------------------------------------------------------------------

export class DexTokenStore {
  private static instance: DexTokenStore;
  private tokens: Map<string, DexToken> = new Map();

  static getInstance(): DexTokenStore {
    if (!DexTokenStore.instance) {
      DexTokenStore.instance = new DexTokenStore();
    }
    return DexTokenStore.instance;
  }

  upsert(token: DexToken): void {
    const key = `${token.chain}:${token.address.toLowerCase()}`;
    this.tokens.set(key, { ...token, lastUpdatedAt: Date.now() });
  }

  get(chain: DexChain, address: string): DexToken | undefined {
    return this.tokens.get(`${chain}:${address.toLowerCase()}`);
  }

  list(chain?: DexChain): DexToken[] {
    const all = Array.from(this.tokens.values());
    if (chain) return all.filter(t => t.chain === chain);
    return all;
  }

  topByVolume(limit = 20, chain?: DexChain): DexToken[] {
    return this.list(chain)
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, limit);
  }

  topByLiquidity(limit = 20, chain?: DexChain): DexToken[] {
    return this.list(chain)
      .sort((a, b) => b.totalLiquidityUsd - a.totalLiquidityUsd)
      .slice(0, limit);
  }

  size(): number {
    return this.tokens.size;
  }
}
