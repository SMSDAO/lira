/**
 * Content-Security-Policy helpers.
 * Call applyCsp(res) in API handlers or _document.tsx to set the header.
 */

import type { NextApiResponse } from 'next';

export interface CspOptions {
  nonce?: string;
  reportUri?: string;
}

export function buildCspHeader(opts: CspOptions = {}): string {
  const { nonce, reportUri } = opts;
  const nonceStr = nonce ? `'nonce-${nonce}'` : '';

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", nonceStr, "'strict-dynamic'"].filter(Boolean),
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https:'],
    'connect-src': [
      "'self'",
      'https://*.thegraph.com',
      'https://*.hub.pinata.cloud',
      'https://*.walletconnect.org',
      'wss://*.walletconnect.org',
      'https://rpc.ankr.com',
    ],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
    'upgrade-insecure-requests': [],
  };

  if (reportUri) {
    directives['report-uri'] = [reportUri];
  }

  return Object.entries(directives)
    .map(([k, v]) => (v.length === 0 ? k : `${k} ${v.join(' ')}`))
    .join('; ');
}

export function applyCsp(res: NextApiResponse, opts: CspOptions = {}): void {
  res.setHeader('Content-Security-Policy', buildCspHeader(opts));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
}
