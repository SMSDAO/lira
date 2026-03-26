# API Reference

## Authentication

> **Current status:** The authentication middleware (SIWE session cookie) is implemented in
> `src/pages/api/auth/verify.ts`, which issues a signed `lira_session` HttpOnly cookie.
> Individual routes that require authentication should validate this cookie.
> Currently the majority of read endpoints are public; write endpoints use rate limiting
> and input validation. Full per-route auth guards will be added incrementally.

Rate limits are enforced per IP:
- Standard API: 120 req/min
- Auth endpoints: 10 req/min
- Strict (image gen, scans): 30 req/min

## Endpoints

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/auth/nonce` | Returns a one-time nonce for SIWE |
| `POST` | `/api/auth/verify` | Verifies a SIWE signature, issues session |

### DEX

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dex/tokens` | List indexed DEX tokens |
| `POST` | `/api/dex/scan` | Trigger a DEX scan across all protocols |

### Images

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/images/generate` | Generate an AI image |

### Timeline

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/timeline` | List timeline events |

### Agents

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/agents` | List agents |
| `POST` | `/api/agents/{id}` | Trigger agent task |

### Jobs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/jobs` | List background job definitions |

### Observability

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/observability/metrics` | Prometheus metrics |

### Web3

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/web3/farcaster-profile?fid=<fid>` | Fetch Farcaster profile |

### Admin (intended for admin role – no server-side auth guard currently enforced)

> **Note:** These endpoints are currently convention-restricted (UI routing only). Server-side role enforcement via `requireRole(Role.ADMIN)` is available in `src/core/rbac/` but not yet wired into these handlers.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/billing` | Billing analytics |
| `GET` | `/api/admin/security` | Security configuration |
| `GET` | `/api/admin/registry` | Token registry |
| `GET/POST` | `/api/admin/moderation` | User moderation |

## Error Responses

Error response shapes vary by endpoint and error type:

| Scenario | Shape |
|----------|-------|
| General error | `{ "error": "message" }` |
| Validation error | `{ "error": "Validation failed", "details": { "field": "reason" } }` |
| Signature/auth error | `{ "error": "message", "detail": "reason string" }` |
| Rate limiting | `{ "error": "Too Many Requests", "retryAfter": <seconds> }` |
| Method not allowed | `{ "error": "Method not allowed" }` |

HTTP status codes follow REST conventions: `400` bad request, `401` unauthenticated, `403` forbidden, `404` not found, `429` rate limited, `500` server error.
