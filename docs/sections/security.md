# Security

## Overview

The Lira platform implements a defence-in-depth security model.

## Layers

### 1. Rate Limiting (`src/security/rateLimit.ts`)

Sliding-window rate limiter applied per IP address:

| Limiter | Max requests | Window |
|---------|-------------|--------|
| `apiLimiter` | 120 | 1 minute |
| `authLimiter` | 10 | 1 minute |
| `strictLimiter` | 30 | 1 minute |

In production, swap the in-memory store for a Redis client for multi-replica consistency.

### 2. CSRF Protection (`src/security/csrf.ts`)

Double-submit cookie pattern. Server sets `csrf_token` as a readable (non-HttpOnly), SameSite=Strict cookie. Browser JS reads it and echoes the value in the `X-CSRF-Token` header on mutating requests. The cookie is not HttpOnly by design – the JS must be able to read it to populate the header.

### 3. Content-Security-Policy (`src/security/csp.ts`)

`applyCsp(res)` is available as a response helper providing strict CSP headers:
- `default-src 'self'`
- `script-src 'self' 'nonce-…' 'strict-dynamic'`
- `frame-ancestors 'none'`
- `object-src 'none'`

Call `applyCsp(res)` in individual API route handlers or in `_document.tsx` to enable it. It is not applied globally by default.

### 4. Request Validation (`src/security/requestValidation.ts`)

Schema-based validation for API request bodies. Supports string, number, boolean, email, and Ethereum address types with min/max length and regex pattern constraints.

### 5. Audit Log (`src/security/audit.ts`)

Append-only in-memory audit trail (upgradeable to a SIEM/database). Records:

- Auth events (login, logout, failed attempts)
- Admin actions (ban, unban, API key revocation)
- Contract calls
- System maintenance events

### 6. RBAC (`src/core/rbac/`)

Seven-tier role hierarchy enforced on all routes:
`guest < user < creator < developer < moderator < admin < super-admin`

Route guards are applied via `requirePermission()` and `requireRole()` middleware.

### 7. WASM Cryptography (`src/wasm/crypto.ts`)

SIWE signature verification runs in a WASM module for performance. Falls back to `viem.verifyMessage` when the WASM binary is unavailable.

## Security Checklist

- [x] Rate limiting on all public API routes
- [ ] CSRF protection on mutating requests (`setCsrfCookie`/`validateCsrf` available but not yet wired into routes)
- [ ] Content-Security-Policy headers (`applyCsp(res)` available as per-route helper, not globally applied)
- [x] Input validation with typed schemas
- [x] Audit log for privileged actions
- [x] RBAC guards on admin/dev routes
- [x] SIWE for wallet authentication
- [ ] Database-backed audit log (requires Prisma migration)
- [ ] Redis-backed rate limiter (requires `REDIS_URL`)
- [ ] WASM cryptographic module (requires Rust + wasm-pack build)
