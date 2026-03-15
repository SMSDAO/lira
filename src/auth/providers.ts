/**
 * Auth provider configuration.
 * Centralises all supported authentication methods for the Lira platform.
 */

export type AuthProviderType =
  | 'email'
  | 'oauth_google'
  | 'oauth_github'
  | 'oauth_twitter'
  | 'wallet_metamask'
  | 'wallet_coinbase'
  | 'wallet_phantom'
  | 'wallet_okx'
  | 'wallet_rainbow'
  | 'wallet_ledger'
  | 'farcaster'
  | 'social_farcaster';

export interface AuthProvider {
  id: AuthProviderType;
  name: string;
  type: 'email' | 'oauth' | 'wallet' | 'decentralised';
  enabled: boolean;
  iconUrl?: string;
}

export const AUTH_PROVIDERS: AuthProvider[] = [
  // Email / password
  { id: 'email', name: 'Email / Password', type: 'email', enabled: true },

  // OAuth
  { id: 'oauth_google', name: 'Google', type: 'oauth', enabled: true },
  { id: 'oauth_github', name: 'GitHub', type: 'oauth', enabled: true },
  { id: 'oauth_twitter', name: 'Twitter / X', type: 'oauth', enabled: true },

  // Wallet (via RainbowKit)
  { id: 'wallet_metamask', name: 'MetaMask', type: 'wallet', enabled: true },
  { id: 'wallet_coinbase', name: 'Coinbase Wallet', type: 'wallet', enabled: true },
  { id: 'wallet_phantom', name: 'Phantom', type: 'wallet', enabled: true },
  { id: 'wallet_okx', name: 'OKX Wallet', type: 'wallet', enabled: true },
  { id: 'wallet_rainbow', name: 'Rainbow', type: 'wallet', enabled: true },
  { id: 'wallet_ledger', name: 'Ledger', type: 'wallet', enabled: true },

  // Decentralised identity
  { id: 'farcaster', name: 'Farcaster', type: 'decentralised', enabled: true },
];

export function getEnabledProviders(type?: AuthProvider['type']): AuthProvider[] {
  const enabled = AUTH_PROVIDERS.filter(p => p.enabled);
  if (type) return enabled.filter(p => p.type === type);
  return enabled;
}
