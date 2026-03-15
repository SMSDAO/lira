/**
 * TypeScript host bindings for the WASM DEX math module.
 *
 * Provides constant-product (x*y=k) and concentrated-liquidity (Uniswap v3)
 * calculations. The pure-JS fallback is used until the Rust WASM is compiled.
 */

// ---------------------------------------------------------------------------
// Constant-product AMM (Uniswap v2 / SushiSwap)
// ---------------------------------------------------------------------------

/**
 * Calculate the output amount for a constant-product AMM swap.
 * amountIn, reserveIn, reserveOut are integer token amounts (not USD).
 * feeBps = fee in basis points (e.g. 30 = 0.3%).
 */
export function calcAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  feeBps = 30,
): bigint {
  if (amountIn === 0n || reserveIn === 0n || reserveOut === 0n) return 0n;
  const feeMultiplier = BigInt(10_000 - feeBps);
  const amountInWithFee = amountIn * feeMultiplier;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 10_000n + amountInWithFee;
  return numerator / denominator;
}

/**
 * Calculate the price impact of a swap as a percentage (0–100).
 */
export function calcPriceImpact(
  amountIn: bigint,
  reserveIn: bigint,
): number {
  if (reserveIn === 0n) return 100;
  const impact = Number((amountIn * 10_000n) / reserveIn) / 100;
  return Math.min(impact, 100);
}

// ---------------------------------------------------------------------------
// Concentrated-liquidity helpers (Uniswap v3)
// ---------------------------------------------------------------------------

const Q96 = 2n ** 96n;

/** Convert a sqrtPriceX96 to a human-readable price. */
export function sqrtPriceX96ToPrice(sqrtPriceX96: bigint, decimals0 = 18, decimals1 = 18): number {
  const price = Number(sqrtPriceX96 * sqrtPriceX96) / Number(Q96 * Q96);
  return price * 10 ** (decimals0 - decimals1);
}

/** Calculate the tick from a given price. */
export function priceToTick(price: number): number {
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

/** Calculate a price from a given tick. */
export function tickToPrice(tick: number): number {
  return 1.0001 ** tick;
}
