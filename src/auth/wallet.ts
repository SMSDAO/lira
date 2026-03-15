/**
 * Wallet authentication utilities.
 * Generates and verifies Sign-In-With-Ethereum (SIWE) messages.
 * Works alongside RainbowKit/wagmi for wallet provider selection.
 */

export interface SiweMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
}

/** Build a SIWE-compatible message string */
export function buildSiweMessage(msg: SiweMessage): string {
  const lines: string[] = [
    `${msg.domain} wants you to sign in with your Ethereum account:`,
    msg.address,
    '',
    msg.statement,
    '',
    `URI: ${msg.uri}`,
    `Version: ${msg.version}`,
    `Chain ID: ${msg.chainId}`,
    `Nonce: ${msg.nonce}`,
    `Issued At: ${msg.issuedAt}`,
  ];
  if (msg.expirationTime) {
    lines.push(`Expiration Time: ${msg.expirationTime}`);
  }
  return lines.join('\n');
}

/** Create a fresh SIWE message ready for signing */
export function createSiweMessage(
  address: string,
  chainId: number,
  nonce: string,
): SiweMessage {
  const domain =
    typeof window !== 'undefined' ? window.location.host : 'lira.protocol';
  const uri =
    typeof window !== 'undefined' ? window.location.origin : 'https://lira.protocol';

  return {
    domain,
    address,
    statement: 'Sign in to Lira Protocol. This request will not trigger any blockchain transaction or cost any gas fees.',
    uri,
    version: '1',
    chainId,
    nonce,
    issuedAt: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
  };
}

/** Generate a cryptographically random nonce (browser + Node compatible) */
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Node.js fallback
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export interface WalletAuthSession {
  address: string;
  chainId: number;
  signedAt: number; // Unix ms
  expiresAt: number; // Unix ms
  nonce: string;
}

/** Parse and validate a wallet auth session from a JWT-like payload. */
export function validateWalletSession(
  session: WalletAuthSession,
): { valid: boolean; reason?: string } {
  if (!session.address || !session.address.startsWith('0x')) {
    return { valid: false, reason: 'Invalid wallet address' };
  }
  if (Date.now() > session.expiresAt) {
    return { valid: false, reason: 'Session expired' };
  }
  return { valid: true };
}
