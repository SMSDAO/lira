/**
 * CSRF protection helpers for Next.js API routes.
 * Double-submit cookie pattern: server sets a readable (non-HttpOnly) cookie;
 * browser JS reads it and echoes the value in the X-CSRF-Token header.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'csrf_token';

/** Generate a random CSRF token using a runtime-agnostic approach. */
export function generateCsrfToken(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    // Runtime-agnostic base64url (no Buffer dependency)
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
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

/**
 * Set the CSRF cookie in the response.
 * The cookie is intentionally NOT HttpOnly so that browser JS can read and
 * echo it in the X-CSRF-Token header (double-submit pattern).
 * Secure is only set in production to allow localhost development.
 */
export function setCsrfCookie(res: NextApiResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieFlags = [
    `${CSRF_COOKIE}=${token}`,
    'Path=/',
    'SameSite=Strict',
    ...(isProduction ? ['Secure'] : []),
  ].join('; ');
  res.setHeader('Set-Cookie', cookieFlags);
}
