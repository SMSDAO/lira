/**
 * Rate-limiting middleware for Next.js API routes.
 * Uses a simple sliding-window algorithm backed by an in-process Map.
 * For multi-replica deployments, swap the store for a Redis client.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

interface WindowEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, WindowEntry>();

export interface RateLimitOptions {
  /** Maximum requests per window */
  max: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** HTTP status sent when limit is exceeded (default 429) */
  statusCode?: number;
  /** Key generator – defaults to IP address */
  keyGenerator?: (req: NextApiRequest) => string;
}

function defaultKey(req: NextApiRequest): string {
  return (
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    'unknown'
  );
}

/**
 * Returns true if the request should proceed; false if rate-limited.
 * When false the response has already been sent.
 */
export function rateLimit(options: RateLimitOptions) {
  const { max, windowMs, statusCode = 429, keyGenerator = defaultKey } = options;

  return function applyRateLimit(
    req: NextApiRequest,
    res: NextApiResponse,
  ): boolean {
    const key = keyGenerator(req);
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    if (entry.count > max) {
      res.status(statusCode).json({
        error: 'Too Many Requests',
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
      return false;
    }

    return true;
  };
}

/** Pre-configured limiters for common use cases */
export const apiLimiter = rateLimit({ max: 120, windowMs: 60_000 });
export const authLimiter = rateLimit({ max: 10, windowMs: 60_000 });
export const strictLimiter = rateLimit({ max: 30, windowMs: 60_000 });
