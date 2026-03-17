/**
 * Public platform configuration.
 *
 * This module is safe to import from both client and server code.
 * It only contains values derived from NEXT_PUBLIC_* env vars, feature flags,
 * and address allow-lists that are intentionally exposed to the browser.
 *
 * Server-only secrets (SESSION_SECRET, API keys, Redis URL, etc.) live in
 * `src/config/server.ts` and must never be imported by client-side code.
 */

export const config = {
  // Application
  appName: 'Lira Protocol',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
  nodeEnv: (process.env.NODE_ENV ?? 'development') as 'development' | 'test' | 'production',

  // Chain
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? '8453', 10), // Base Mainnet
  chainName: process.env.NEXT_PUBLIC_CHAIN_NAME ?? 'Base',
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? 'https://mainnet.base.org',

  // WalletConnect - matches existing convention in src/pages/_app.tsx and scripts/validate-env.ts
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID ?? '',

  // Feature flags
  features: {
    imageGeneration: process.env.FEATURE_IMAGE_GENERATION !== 'false',
    dexScanner: process.env.FEATURE_DEX_SCANNER !== 'false',
    farcasterLogin: process.env.FEATURE_FARCASTER_LOGIN !== 'false',
    governanceVoting: process.env.FEATURE_GOVERNANCE_VOTING === 'true',
    creatorMinting: process.env.FEATURE_CREATOR_MINTING !== 'false',
    sso: process.env.FEATURE_SSO === 'true',
  },

  // Admin / dev address allow-lists (intentionally public – used for UI gating too)
  adminAddresses: (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES ?? process.env.ADMIN_ADDRESSES ?? '')
    .split(',')
    .map(a => a.trim().toLowerCase())
    .filter(Boolean),

  devAddresses: (process.env.NEXT_PUBLIC_DEV_ADDRESSES ?? process.env.DEV_ADDRESSES ?? '')
    .split(',')
    .map(a => a.trim().toLowerCase())
    .filter(Boolean),
} as const;

export default config;
