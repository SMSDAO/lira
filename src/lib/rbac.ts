// Role-based access control types and utilities
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  DEV = 'dev',
}

export interface RoleConfig {
  role: UserRole;
  label: string;
  description: string;
  permissions: string[];
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  [UserRole.USER]: {
    role: UserRole.USER,
    label: 'User',
    description: 'Standard user with access to dashboard, token launch, and agents',
    permissions: ['dashboard:view', 'launch:create', 'agents:manage'],
  },
  [UserRole.ADMIN]: {
    role: UserRole.ADMIN,
    label: 'Admin',
    description: 'Administrator with full system access and management capabilities',
    permissions: [
      'dashboard:view',
      'launch:create',
      'agents:manage',
      'admin:users',
      'admin:fees',
      'admin:settings',
      'admin:billing',
    ],
  },
  [UserRole.DEV]: {
    role: UserRole.DEV,
    label: 'Developer',
    description: 'Developer with access to API docs, testing tools, and system internals',
    permissions: [
      'dashboard:view',
      'launch:create',
      'agents:manage',
      'dev:api',
      'dev:docs',
      'dev:testing',
      'dev:logs',
    ],
  },
};

// Admin wallet addresses from environment
const ADMIN_ADDRESSES = (process.env.ADMIN_ADDRESSES || '')
  .split(',')
  .map(addr => addr.trim().toLowerCase())
  .filter(Boolean);

// Dev wallet addresses - can be extended
const DEV_ADDRESSES = (process.env.DEV_ADDRESSES || '')
  .split(',')
  .map(addr => addr.trim().toLowerCase())
  .filter(Boolean);

/**
 * Determine user role based on wallet address
 */
export function getUserRole(address?: string): UserRole {
  if (!address) return UserRole.USER;
  
  const normalizedAddress = address.toLowerCase();
  
  if (ADMIN_ADDRESSES.includes(normalizedAddress)) {
    return UserRole.ADMIN;
  }
  
  if (DEV_ADDRESSES.includes(normalizedAddress)) {
    return UserRole.DEV;
  }
  
  return UserRole.USER;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const config = ROLE_CONFIGS[role];
  return config.permissions.includes(permission);
}

/**
 * Check if user can access a route
 */
export function canAccessRoute(role: UserRole, route: string): boolean {
  if (route.startsWith('/admin')) {
    return role === UserRole.ADMIN;
  }
  
  if (route.startsWith('/dev')) {
    return role === UserRole.DEV || role === UserRole.ADMIN;
  }
  
  return true; // All roles can access other routes
}

/**
 * Get accessible dashboard routes for a role
 */
export function getAccessibleRoutes(role: UserRole) {
  const baseRoutes = [
    { name: 'Dashboard', href: '/dashboard', permission: 'dashboard:view' },
    { name: 'Launch Token', href: '/launch', permission: 'launch:create' },
    { name: 'Agents', href: '/agents', permission: 'agents:manage' },
  ];
  
  const adminRoutes = [
    { name: 'Admin', href: '/admin', permission: 'admin:users' },
  ];
  
  const devRoutes = [
    { name: 'Dev Portal', href: '/dev', permission: 'dev:api' },
  ];
  
  let routes = [...baseRoutes];
  
  if (role === UserRole.ADMIN) {
    routes = [...routes, ...adminRoutes];
  }
  
  if (role === UserRole.DEV || role === UserRole.ADMIN) {
    routes = [...routes, ...devRoutes];
  }
  
  return routes.filter(route => 
    hasPermission(role, route.permission)
  );
}
