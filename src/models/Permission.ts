/**
 * Permission model for enterprise RBAC governance.
 * Defines all permission strings, role–permission mappings, and
 * helper utilities used across API routes, dashboards, agents, and
 * smart-contract interactions.
 */

// ---------------------------------------------------------------------------
// Permission constants
// ---------------------------------------------------------------------------

export const Permissions = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',

  // Token launch
  LAUNCH_CREATE: 'launch:create',

  // Agents
  AGENTS_VIEW: 'agents:view',
  AGENTS_MANAGE: 'agents:manage',
  AGENTS_PAUSE: 'agents:pause',

  // Admin
  ADMIN_USERS: 'admin:users',
  ADMIN_FEES: 'admin:fees',
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_BILLING: 'admin:billing',
  ADMIN_ROLES: 'admin:roles',
  ADMIN_AUDIT: 'admin:audit',
  ADMIN_FEATURE_FLAGS: 'admin:featureFlags',
  ADMIN_RATE_LIMITS: 'admin:rateLimits',
  ADMIN_WALLETS: 'admin:wallets',
  ADMIN_SUBSCRIPTIONS: 'admin:subscriptions',
  ADMIN_ALERTS: 'admin:alerts',

  // Developer
  DEV_API: 'dev:api',
  DEV_DOCS: 'dev:docs',
  DEV_TESTING: 'dev:testing',
  DEV_LOGS: 'dev:logs',
  DEV_WEBHOOKS: 'dev:webhooks',
  DEV_SDK: 'dev:sdk',
  DEV_METRICS: 'dev:metrics',

  // System
  SYSTEM_CLUSTER: 'system:cluster',
  SYSTEM_QUEUE: 'system:queue',
  SYSTEM_HEALTH: 'system:health',

  // Web3 / DEX
  WEB3_CONNECT: 'web3:connect',
  WEB3_CONTRACTS: 'web3:contracts',
  DEX_VIEW: 'dex:view',
  DEX_SCAN: 'dex:scan',

  // Social / Creator
  SOCIAL_POST: 'social:post',
  SOCIAL_MINT: 'social:mint',
  CREATOR_ANALYTICS: 'creator:analytics',

  // Security
  SECURITY_VIEW: 'security:view',
  SECURITY_MANAGE: 'security:manage',

  // Moderation
  MOD_BAN: 'mod:ban',
  MOD_REVIEW: 'mod:review',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

// ---------------------------------------------------------------------------
// Role definitions
// ---------------------------------------------------------------------------

export enum Role {
  GUEST = 'guest',
  USER = 'user',
  CREATOR = 'creator',
  DEVELOPER = 'developer',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super-admin',
}

/** Ordered role hierarchy – higher index = more privileged */
export const ROLE_HIERARCHY: Role[] = [
  Role.GUEST,
  Role.USER,
  Role.CREATOR,
  Role.DEVELOPER,
  Role.MODERATOR,
  Role.ADMIN,
  Role.SUPER_ADMIN,
];

// ---------------------------------------------------------------------------
// Role–permission mappings
// ---------------------------------------------------------------------------

type PermissionSet = readonly Permission[];

export const ROLE_PERMISSIONS: Record<Role, PermissionSet> = {
  [Role.GUEST]: [
    Permissions.DASHBOARD_VIEW,
    Permissions.DEX_VIEW,
  ],
  [Role.USER]: [
    Permissions.DASHBOARD_VIEW,
    Permissions.LAUNCH_CREATE,
    Permissions.AGENTS_VIEW,
    Permissions.WEB3_CONNECT,
    Permissions.DEX_VIEW,
    Permissions.SOCIAL_POST,
  ],
  [Role.CREATOR]: [
    Permissions.DASHBOARD_VIEW,
    Permissions.LAUNCH_CREATE,
    Permissions.AGENTS_VIEW,
    Permissions.AGENTS_MANAGE,
    Permissions.WEB3_CONNECT,
    Permissions.WEB3_CONTRACTS,
    Permissions.DEX_VIEW,
    Permissions.SOCIAL_POST,
    Permissions.SOCIAL_MINT,
    Permissions.CREATOR_ANALYTICS,
  ],
  [Role.DEVELOPER]: [
    Permissions.DASHBOARD_VIEW,
    Permissions.LAUNCH_CREATE,
    Permissions.AGENTS_VIEW,
    Permissions.AGENTS_MANAGE,
    Permissions.WEB3_CONNECT,
    Permissions.WEB3_CONTRACTS,
    Permissions.DEX_VIEW,
    Permissions.DEX_SCAN,
    Permissions.SOCIAL_POST,
    Permissions.DEV_API,
    Permissions.DEV_DOCS,
    Permissions.DEV_TESTING,
    Permissions.DEV_LOGS,
    Permissions.DEV_WEBHOOKS,
    Permissions.DEV_SDK,
    Permissions.DEV_METRICS,
  ],
  [Role.MODERATOR]: [
    Permissions.DASHBOARD_VIEW,
    Permissions.AGENTS_VIEW,
    Permissions.MOD_BAN,
    Permissions.MOD_REVIEW,
    Permissions.ADMIN_USERS,
    Permissions.ADMIN_AUDIT,
    Permissions.SECURITY_VIEW,
  ],
  [Role.ADMIN]: [
    Permissions.DASHBOARD_VIEW,
    Permissions.LAUNCH_CREATE,
    Permissions.AGENTS_VIEW,
    Permissions.AGENTS_MANAGE,
    Permissions.AGENTS_PAUSE,
    Permissions.WEB3_CONNECT,
    Permissions.WEB3_CONTRACTS,
    Permissions.DEX_VIEW,
    Permissions.DEX_SCAN,
    Permissions.SOCIAL_POST,
    Permissions.SOCIAL_MINT,
    Permissions.CREATOR_ANALYTICS,
    Permissions.ADMIN_USERS,
    Permissions.ADMIN_FEES,
    Permissions.ADMIN_SETTINGS,
    Permissions.ADMIN_BILLING,
    Permissions.ADMIN_ROLES,
    Permissions.ADMIN_AUDIT,
    Permissions.ADMIN_FEATURE_FLAGS,
    Permissions.ADMIN_RATE_LIMITS,
    Permissions.ADMIN_WALLETS,
    Permissions.ADMIN_SUBSCRIPTIONS,
    Permissions.ADMIN_ALERTS,
    Permissions.DEV_API,
    Permissions.DEV_DOCS,
    Permissions.DEV_TESTING,
    Permissions.DEV_LOGS,
    Permissions.DEV_WEBHOOKS,
    Permissions.DEV_SDK,
    Permissions.DEV_METRICS,
    Permissions.SYSTEM_CLUSTER,
    Permissions.SYSTEM_QUEUE,
    Permissions.SYSTEM_HEALTH,
    Permissions.SECURITY_VIEW,
    Permissions.SECURITY_MANAGE,
    Permissions.MOD_BAN,
    Permissions.MOD_REVIEW,
  ],
  [Role.SUPER_ADMIN]: [
    // Inherits everything – wildcard handled in helpers
    Permissions.DASHBOARD_VIEW,
    Permissions.LAUNCH_CREATE,
    Permissions.AGENTS_VIEW,
    Permissions.AGENTS_MANAGE,
    Permissions.AGENTS_PAUSE,
    Permissions.WEB3_CONNECT,
    Permissions.WEB3_CONTRACTS,
    Permissions.DEX_VIEW,
    Permissions.DEX_SCAN,
    Permissions.SOCIAL_POST,
    Permissions.SOCIAL_MINT,
    Permissions.CREATOR_ANALYTICS,
    Permissions.ADMIN_USERS,
    Permissions.ADMIN_FEES,
    Permissions.ADMIN_SETTINGS,
    Permissions.ADMIN_BILLING,
    Permissions.ADMIN_ROLES,
    Permissions.ADMIN_AUDIT,
    Permissions.ADMIN_FEATURE_FLAGS,
    Permissions.ADMIN_RATE_LIMITS,
    Permissions.ADMIN_WALLETS,
    Permissions.ADMIN_SUBSCRIPTIONS,
    Permissions.ADMIN_ALERTS,
    Permissions.DEV_API,
    Permissions.DEV_DOCS,
    Permissions.DEV_TESTING,
    Permissions.DEV_LOGS,
    Permissions.DEV_WEBHOOKS,
    Permissions.DEV_SDK,
    Permissions.DEV_METRICS,
    Permissions.SYSTEM_CLUSTER,
    Permissions.SYSTEM_QUEUE,
    Permissions.SYSTEM_HEALTH,
    Permissions.SECURITY_VIEW,
    Permissions.SECURITY_MANAGE,
    Permissions.MOD_BAN,
    Permissions.MOD_REVIEW,
  ],
};

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

/** Returns true when the given role has a specific permission. */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as Permission[]).includes(permission);
}

/** Returns true when roleA is at least as privileged as roleB. */
export function roleAtLeast(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY.indexOf(roleA) >= ROLE_HIERARCHY.indexOf(roleB);
}

/** Returns all permissions granted to a role. */
export function getPermissionsForRole(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role]] as Permission[];
}
