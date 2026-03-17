/**
 * Auth provider configuration.
 * Centralises all supported authentication methods for the Lira platform.
 */

import { initSSOProvider } from './sso';

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
  | 'social_farcaster'
  | 'enterprise_sso';

export interface AuthProvider {
  id: AuthProviderType;
  name: string;
  type: 'email' | 'oauth' | 'wallet' | 'decentralised' | 'enterprise';
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

// Conditionally append the enterprise SSO provider when the feature flag is enabled
const ssoProvider = initSSOProvider();
if (ssoProvider) {
  AUTH_PROVIDERS.push({
    id: 'enterprise_sso',
    name: ssoProvider.name,
    type: 'enterprise',
    enabled: ssoProvider.enabled,
  });
}

export function getEnabledProviders(type?: AuthProvider['type']): AuthProvider[] {
  const enabled = AUTH_PROVIDERS.filter(p => p.enabled);
  if (type) return enabled.filter(p => p.type === type);
  return enabled;
}
