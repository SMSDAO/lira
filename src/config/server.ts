/**
 * Server-only configuration.
 *
 * This module contains secrets and server-side values that must NEVER be
 * bundled into the browser. Import only from API routes, server components,
 * or Node.js scripts – never from React components, hooks, or pages that
 * render client-side.
 *
 * All NEXT_PUBLIC_* values and feature flags live in `src/config/index.ts`.
 */

export const serverConfig = {
  // Auth / session
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
} as const;

export default serverConfig;
