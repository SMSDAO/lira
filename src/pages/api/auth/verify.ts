import type { NextApiRequest, NextApiResponse } from 'next';
import { createHmac } from 'crypto';
import { verifySiweSignature } from '@/wasm/crypto';
import { consumeNonce } from '@/auth/wallet';
import { authLimiter } from '@/security/rateLimit';
import { validateBody } from '@/security/requestValidation';
import { auditLog } from '@/security/audit';
import { config } from '@/config';
import { serverConfig } from '@/config/server';

/**
 * Extract the client IP from the request.
 * `x-forwarded-for` may contain a comma-separated list of IPs (added by each
 * proxy hop) and can be spoofed unless your reverse proxy strips/sets it.
 * We always take the first entry (original client), falling back to the
 * socket remote address.
 */
function getClientIp(req: NextApiRequest): string {
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const first = Array.isArray(xff) ? xff[0] : xff.split(',')[0];
    return first.trim();
  }
  return req.socket?.remoteAddress ?? 'unknown';
}

const schema = {
  message: { type: 'string' as const, required: true },
  signature: { type: 'string' as const, required: true },
  address: { type: 'address' as const, required: true },
};

/**
 * Parse SIWE message text and extract key fields.
 * Based on the EIP-4361 text format produced by buildSiweMessage().
 */
function parseSiweMessage(text: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const lines = text.split('\n');
  for (const line of lines) {
    const chainMatch = /^Chain ID: (.+)$/.exec(line);
    if (chainMatch) { fields.chainId = chainMatch[1].trim(); continue; }
    const nonceMatch = /^Nonce: (.+)$/.exec(line);
    if (nonceMatch) { fields.nonce = nonceMatch[1].trim(); continue; }
    const issuedAtMatch = /^Issued At: (.+)$/.exec(line);
    if (issuedAtMatch) { fields.issuedAt = issuedAtMatch[1].trim(); continue; }
    const expiryMatch = /^Expiration Time: (.+)$/.exec(line);
    if (expiryMatch) { fields.expirationTime = expiryMatch[1].trim(); continue; }
    const uriMatch = /^URI: (.+)$/.exec(line);
    if (uriMatch) { fields.uri = uriMatch[1].trim(); continue; }
  }
  // EIP-4361 format: line 0 = "<domain> wants you to sign in with your Ethereum account:"
  //                  line 1 = <address>
  const domainMatch = /^(.+) wants you to sign in/.exec(lines[0] ?? '');
  if (domainMatch) fields.domain = domainMatch[1].trim();
  const addressLine = (lines[1] ?? '').trim();
  if (addressLine) fields.address = addressLine;
  return fields;
}

/**
 * Sign a session payload using HMAC-SHA256 with the platform SESSION_SECRET.
 * Uses serverConfig.sessionSecret which already enforces fail-fast in production.
 */
async function signSessionToken(payload: Record<string, unknown>): Promise<string> {
  const secret = serverConfig.sessionSecret;
  const data = JSON.stringify(payload);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    // Use Buffer for base64url encoding – safe in both Node.js and edge runtimes
    const b64 = Buffer.from(sig).toString('base64url');
    return `${Buffer.from(data).toString('base64url')}.${b64}`;
  }

  // Node.js fallback
  const mac = createHmac('sha256', secret).update(data).digest('base64url');
  return `${Buffer.from(data).toString('base64url')}.${mac}`;
}

/**
 * POST /api/auth/verify – verifies a SIWE signature and issues a signed session token.
 * Validates: signature, nonce (one-time), expiration time, and chain ID.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!authLimiter(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!validateBody(schema)(req, res)) return;

  const { message, signature, address } = req.body as {
    message: string;
    signature: string;
    address: string;
  };

  // --- 1. Parse SIWE message fields ---
  const parsed = parseSiweMessage(message);

  // --- 1a. Validate message address matches the submitted address ---
  // EIP-4361 format: lines[1] (second line, 0-indexed) contains the Ethereum address.
  // If present in the parsed message, it must match the submitted address.
  if (!parsed.address) {
    return res.status(401).json({ error: 'SIWE message is missing an address' });
  }
  if (parsed.address.toLowerCase() !== address.toLowerCase()) {
    auditLog.record({ action: 'auth.failed', actor: address, ip: getClientIp(req) });
    return res.status(401).json({ error: 'Address in SIWE message does not match submitted address' });
  }

  // --- 1b. Validate domain matches this server's host (prevents cross-domain replay) ---
  const expectedHost = (req.headers.host ?? '').toLowerCase();
  if (!parsed.domain) {
    return res.status(401).json({ error: 'SIWE message is missing a domain' });
  }
  if (parsed.domain.toLowerCase() !== expectedHost) {
    auditLog.record({ action: 'auth.failed', actor: address, ip: getClientIp(req) });
    return res.status(401).json({
      error: `Domain mismatch: expected ${expectedHost}, got ${parsed.domain}`,
    });
  }

  // --- 1c. Validate URI origin matches this server's host (prevents phishing via external URIs) ---
  if (parsed.uri) {
    try {
      const parsedUri = new URL(parsed.uri);
      if (parsedUri.host.toLowerCase() !== expectedHost) {
        auditLog.record({ action: 'auth.failed', actor: address, ip: getClientIp(req) });
        return res.status(401).json({
          error: `URI host mismatch: expected ${expectedHost}, got ${parsedUri.host}`,
        });
      }
      if (process.env.NODE_ENV === 'production' && parsedUri.protocol !== 'https:') {
        return res.status(401).json({ error: 'SIWE message URI must use https in production' });
      }
    } catch {
      return res.status(401).json({ error: 'SIWE message contains an invalid URI' });
    }
  }

  // --- 2. Validate expiration time ---
  if (parsed.expirationTime) {
    const expiry = new Date(parsed.expirationTime).getTime();
    if (Number.isFinite(expiry) && Date.now() > expiry) {
      return res.status(401).json({ error: 'SIWE message has expired' });
    }
  }

  // --- 3. Validate chain ID matches expected chain (required field) ---
  const expectedChainId = String(config.chainId);
  if (!parsed.chainId) {
    return res.status(401).json({ error: 'SIWE message is missing Chain ID' });
  }
  if (parsed.chainId !== expectedChainId) {
    return res.status(401).json({
      error: `Chain ID mismatch: expected ${expectedChainId}, got ${parsed.chainId}`,
    });
  }

  // --- 4. Validate and consume nonce (one-time use) ---
  if (!parsed.nonce) {
    return res.status(401).json({ error: 'SIWE message is missing a nonce' });
  }
  if (!consumeNonce(parsed.nonce)) {
    auditLog.record({ action: 'auth.failed', actor: address, ip: getClientIp(req) });
    return res.status(401).json({ error: 'Invalid or expired nonce' });
  }

  // --- 5. Verify cryptographic signature ---
  const result = await verifySiweSignature(message, signature, address);
  if (!result.valid) {
    auditLog.record({ action: 'auth.failed', actor: address, ip: getClientIp(req) });
    return res.status(401).json({ error: 'Invalid signature', detail: result.error });
  }

  // --- 6. Issue signed session cookie ---
  const sessionPayload = {
    address,
    chainId: config.chainId,
    signedAt: Date.now(),
    expiresAt: Date.now() + serverConfig.sessionMaxAgeMs,
  };

  auditLog.record({ action: 'auth.login', actor: address, ip: getClientIp(req) });

  const token = await signSessionToken(sessionPayload);
  const isProduction = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    [
      `lira_session=${token}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      `Max-Age=${Math.floor(serverConfig.sessionMaxAgeMs / 1000)}`,
      ...(isProduction ? ['Secure'] : []),
    ].join('; '),
  );

  return res.status(200).json({ authenticated: true, expiresAt: sessionPayload.expiresAt });
}
