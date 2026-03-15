/**
 * CSRF protection helpers for Next.js API routes.
 * Double-submit cookie pattern: server sets a token in a cookie;
 * client must echo it in the X-CSRF-Token header.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'csrf_token';

/** Generate a random CSRF token */
export function generateCsrfToken(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Buffer.from(bytes).toString('base64url');
  }
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

/**
 * Validate the CSRF token on mutating requests (POST, PUT, PATCH, DELETE).
 * Returns true if valid or if the request is a safe method; false + 403 otherwise.
 */
export function validateCsrf(req: NextApiRequest, res: NextApiResponse): boolean {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method ?? 'GET')) return true;

  const cookieHeader = req.headers.cookie ?? '';
  const cookieToken = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${CSRF_COOKIE}=`))
    ?.split('=')[1];

  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ error: 'Invalid CSRF token' });
    return false;
  }

  return true;
}

/** Set a new CSRF cookie in the response. */
export function setCsrfCookie(res: NextApiResponse, token: string): void {
  res.setHeader(
    'Set-Cookie',
    `${CSRF_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Secure`,
  );
}
