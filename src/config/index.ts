/**
 * Centralised platform configuration.
 * All environment-dependent values are read here and exported as typed constants.
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

  // Auth
  sessionSecret:
    process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET
      ? (() => { throw new Error('SESSION_SECRET must be set in production'); })()
      : (process.env.SESSION_SECRET ?? 'dev-secret-change-in-production'),
  sessionMaxAgeMs: 24 * 60 * 60 * 1000, // 24 h

  // AI / Image generation
  openAiApiKey: process.env.OPENAI_API_KEY ?? '',
  replicateApiToken: process.env.REPLICATE_API_TOKEN ?? '',
  stableDiffusionUrl: process.env.SD_API_URL ?? 'http://localhost:7860',

  // Redis
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',

  // Observability
  otelServiceName: process.env.OTEL_SERVICE_NAME ?? 'lira',
  otelExporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? '',

  // Feature flags
  features: {
    imageGeneration: process.env.FEATURE_IMAGE_GENERATION !== 'false',
    dexScanner: process.env.FEATURE_DEX_SCANNER !== 'false',
    farcasterLogin: process.env.FEATURE_FARCASTER_LOGIN !== 'false',
    governanceVoting: process.env.FEATURE_GOVERNANCE_VOTING === 'true',
    creatorMinting: process.env.FEATURE_CREATOR_MINTING !== 'false',
  },

  // Admin
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
