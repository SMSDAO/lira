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

/**
 * Convert a sqrtPriceX96 to a human-readable price.
 * Uses fixed-point bigint arithmetic throughout to avoid Number overflow for
 * large Uniswap v3 sqrtPriceX96 values, converting to Number only at the end.
 *
 * **Precision note**: `rawPriceScaled` is converted to `Number` before the
 * final division. When `rawPriceScaled > 2^53 - 1` this conversion is
 * approximate (at most 1 ULP error). For extremely large or small prices
 * (e.g. WBTC/USDC), callers should treat the result as an estimate and use
 * a bigint-based decimal library if exact precision is required.
 */
export function sqrtPriceX96ToPrice(sqrtPriceX96: bigint, decimals0 = 18, decimals1 = 18): number {
  // price = (sqrtPriceX96 / 2^96)^2 = sqrtPriceX96^2 / 2^192
  // To keep precision, we scale the result before dividing:
  //   price * 10^18 = sqrtPriceX96^2 * 10^18 / 2^192
  const SCALE = 10n ** 18n;
  const numerator = sqrtPriceX96 * sqrtPriceX96 * SCALE;
  const denominator = Q96 * Q96;
  const rawPriceScaled = numerator / denominator;
  // Guard against Number overflow: rawPriceScaled can exceed 2^53 for very
  // large sqrtPriceX96 values (e.g. tokens with extreme price ratios).
  // When it does, we reduce precision by dividing the bigint by 10^6 first,
  // then compensate in the floating-point division (÷ 10^12 instead of ÷ 10^18).
  // Both paths compute rawPriceScaled / 10^18; the high-value path trades up to
  // 6 decimal digits of precision for a finite result.
  let priceScaledNum: number;
  const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
  if (rawPriceScaled > MAX_SAFE) {
    // Shift right by 10^6 (exact bigint division) then scale the divisor down
    priceScaledNum = Number(rawPriceScaled / 1_000_000n) / 1e12;
  } else {
    priceScaledNum = Number(rawPriceScaled) / 1e18;
  }
  // Adjust for token decimal difference
  const decimalAdjust = decimals0 - decimals1;
  return decimalAdjust >= 0
    ? priceScaledNum * 10 ** decimalAdjust
    : priceScaledNum / 10 ** (-decimalAdjust);
}

/** Calculate the tick from a given price. Throws for non-positive prices. */
export function priceToTick(price: number): number {
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`priceToTick: price must be a positive finite number, got ${price}`);
  }
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

/** Calculate a price from a given tick. */
export function tickToPrice(tick: number): number {
  return 1.0001 ** tick;
}
