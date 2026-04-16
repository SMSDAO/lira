/**
 * /core/rbac – Enterprise RBAC extension.
 *
 * This module extends (without modifying) the existing src/lib/rbac.ts,
 * adding the full seven-tier role hierarchy and permission-guard helpers
 * used across API routes, dashboards, agents, and smart contracts.
 *
 * Existing code continues to import from @/lib/rbac without changes.
 */

import { Permission, Role, ROLE_PERMISSIONS, ROLE_HIERARCHY, roleAtLeast } from '@/models/Permission';
import type { NextApiRequest, NextApiResponse } from 'next';

export { Role, ROLE_HIERARCHY, ROLE_PERMISSIONS };
export type { Permission };

// ---------------------------------------------------------------------------
// Route-level guard
// ---------------------------------------------------------------------------

/** Returns the Role extracted from request headers / session. */
export function getRoleFromRequest(req: NextApiRequest): Role {
  // In production use a signed JWT or session cookie.
  // For now we read an x-lira-role header so tests and dev can exercise guards.
  const headerRole = req.headers['x-lira-role'] as string | undefined;
  if (headerRole && Object.values(Role).includes(headerRole as Role)) {
    return headerRole as Role;
  }
  return Role.GUEST;
}

/** Middleware that returns 403 when the caller lacks the required permission. */
export function requirePermission(permission: Permission) {
  return function guard(
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => void,
  ): void {
    const role = getRoleFromRequest(req);
    const granted = (ROLE_PERMISSIONS[role] as Permission[]).includes(permission);
    if (!granted) {
      res.status(403).json({ error: 'Forbidden', required: permission, role });
      return;
    }
    next();
  };
}

/** Middleware that returns 403 when the caller is below the minimum role. */
export function requireRole(minimumRole: Role) {
  return function guard(
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => void,
  ): void {
    const role = getRoleFromRequest(req);
    if (!roleAtLeast(role, minimumRole)) {
      res.status(403).json({ error: 'Forbidden', minimum: minimumRole, role });
      return;
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// React hook helper (client-side)
// ---------------------------------------------------------------------------

/** Maps the legacy UserRole strings from src/lib/rbac.ts to the new Role enum. */
export function legacyRoleToNew(legacy: string): Role {
  switch (legacy) {
    case 'admin':
      return Role.ADMIN;
    case 'dev':
      return Role.DEVELOPER;
    case 'user':
    default:
      return Role.USER;
  }
}

/** Returns a human-readable label for each role. */
export function roleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    [Role.GUEST]: 'Guest',
    [Role.USER]: 'User',
    [Role.CREATOR]: 'Creator',
    [Role.DEVELOPER]: 'Developer',
    [Role.MODERATOR]: 'Moderator',
    [Role.ADMIN]: 'Admin',
    [Role.SUPER_ADMIN]: 'Super Admin',
  };
  return labels[role] ?? role;
}
