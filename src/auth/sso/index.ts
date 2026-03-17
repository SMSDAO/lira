/**
 * Enterprise SSO stub – Okta / SAML ready.
 *
 * This module provides the integration surface for enterprise Single Sign-On.
 * It is disabled by default (FEATURE_SSO=true to enable) and returns a mock
 * provider object so the rest of the auth flow can import it safely without
 * needing a live IdP connection.
 *
 * To wire a real Okta SAML/OIDC integration, replace `mockSsoProvider` with
 * an `@okta/oidc-middleware` or `passport-saml` adapter that reads
 * SSO_CLIENT_ID, SSO_CLIENT_SECRET, SSO_ISSUER_URL, and SSO_REDIRECT_URI
 * from the environment.
 */

import { config } from '@/config';

/** Duration (ms) of an SSO-issued session. Configurable via SSO_SESSION_HOURS env var. */
const SSO_SESSION_DURATION_MS =
  parseInt(process.env.SSO_SESSION_HOURS ?? '8', 10) * 60 * 60 * 1000;

export interface SSOProvider {
  /** Unique identifier for this provider */
  id: string;
  /** Human-readable label shown in auth UI */
  name: string;
  /** Protocol this provider uses */
  protocol: 'SAML' | 'OIDC';
  /** Whether this provider is active (controlled by feature flag) */
  enabled: boolean;
  /** Entry point URL for initiating the SSO flow */
  loginUrl: string;
}

export interface SSOSession {
  /** External IdP user identifier */
  externalId: string;
  /** Email address from the IdP assertion/claims */
  email: string;
  /** Roles returned by the IdP (mapped to Lira RBAC roles) */
  roles: string[];
  /** Raw IdP name identifier (for SAML) or `sub` claim (for OIDC) */
  nameId: string;
  /** Timestamp (ms) when the IdP session expires */
  expiresAt: number;
}

/**
 * Mock SSO provider returned when `config.features.sso` is `true` but no
 * real IdP credentials are configured. Swap out the body of this function
 * to call the real Okta / SAML SDK.
 */
function mockSsoProvider(): SSOProvider {
  return {
    id: 'enterprise-sso',
    name: process.env.SSO_PROVIDER_NAME ?? 'Enterprise SSO',
    protocol: (process.env.SSO_PROTOCOL as 'SAML' | 'OIDC') ?? 'SAML',
    enabled: true,
    loginUrl: process.env.SSO_LOGIN_URL ?? '/api/auth/sso/login',
  };
}

/**
 * Initialise the SSO provider for this deployment.
 *
 * Returns `null` when the feature flag is disabled so callers can
 * conditionally render/hide SSO login options without throwing.
 *
 * @example
 * ```ts
 * const sso = initSSOProvider();
 * if (sso) AUTH_PROVIDERS.push({ ...sso, type: 'enterprise' });
 * ```
 */
export function initSSOProvider(): SSOProvider | null {
  if (!config.features.sso) return null;
  return mockSsoProvider();
}

/**
 * Parse an incoming SSO assertion/callback into a normalised `SSOSession`.
 *
 * In production this function should:
 *  - For SAML: call `passport-saml`'s `validatePostResponse` with the raw
 *    SAMLResponse body, then map attribute statements to `SSOSession` fields.
 *  - For OIDC: call `@okta/jwt-verifier` or the OIDC introspection endpoint
 *    and map claims to `SSOSession` fields.
 *
 * The current stub accepts any payload (dev/test only).
 *
 * @throws {Error} if `config.features.sso` is disabled.
 */
export async function parseSSOAssertion(
  rawAssertion: Record<string, unknown>,
): Promise<SSOSession> {
  if (!config.features.sso) {
    throw new Error('SSO is not enabled. Set FEATURE_SSO=true to use enterprise login.');
  }

  // Stub: in production validate the SAML/OIDC assertion here
  return {
    externalId: String(rawAssertion.sub ?? rawAssertion.nameId ?? 'unknown'),
    email: String(rawAssertion.email ?? ''),
    roles: Array.isArray(rawAssertion.roles) ? (rawAssertion.roles as string[]) : ['user'],
    nameId: String(rawAssertion.nameId ?? rawAssertion.sub ?? ''),
    expiresAt: Date.now() + SSO_SESSION_DURATION_MS,
  };
}
