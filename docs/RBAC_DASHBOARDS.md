# Role-Based Dashboard Access

The Lira Protocol implements a role-based access control (RBAC) system that provides different dashboard experiences based on user roles.

## User Roles

### 1. User (Default)
- **Description**: Standard user with basic access
- **Access**: Dashboard, Token Launch, Agents
- **Permissions**:
  - View personal dashboard
  - Launch tokens
  - Create and manage personal agents
  - View portfolio and earnings

### 2. Admin
- **Description**: Administrator with full system access
- **Access**: All User features + Admin Dashboard
- **Permissions**:
  - All user permissions
  - User management
  - Fee configuration
  - System settings
  - Billing management
  - Protocol controls

### 3. Developer
- **Description**: Developer with technical access
- **Access**: All User features + Dev Portal
- **Permissions**:
  - All user permissions
  - API documentation access
  - System logs viewing
  - Testing tools
  - Database schema viewing

## Configuration

### Setting Up Roles

Roles are determined by wallet addresses configured in environment variables:

```env
# Admin wallet addresses (comma-separated)
ADMIN_ADDRESSES=0x1234...abcd,0x5678...efgh

# Developer wallet addresses (comma-separated)
DEV_ADDRESSES=0xabcd...1234,0xefgh...5678
```

### Role Detection

The system automatically detects user roles when they connect their wallet:

1. User connects wallet via RainbowKit
2. System checks wallet address against configured role lists
3. Role is assigned and appropriate navigation is displayed
4. Access to role-specific pages is granted

## Dashboard Routes

### User Dashboard (`/dashboard`)
- **Access**: All authenticated users
- **Features**:
  - Portfolio statistics
  - Token holdings
  - Active agents
  - Earnings overview

### Admin Dashboard (`/admin`)
- **Access**: Admin role only
- **Features**:
  - User management
  - Fee settings
  - System health
  - Billing overview
  - Security controls

### Dev Portal (`/dev`)
- **Access**: Dev and Admin roles
- **Features**:
  - API endpoint documentation
  - System health monitoring
  - Log viewer
  - Database schema
  - Testing tools

## Implementation Details

### Role Hook

```typescript
import { useUserRole } from '@/hooks/useUserRole';
import { UserRole } from '@/lib/rbac';

function MyComponent() {
  const userRole = useUserRole();
  
  if (userRole === UserRole.ADMIN) {
    // Show admin features
  }
}
```

### Access Control

```typescript
import { canAccessRoute } from '@/lib/rbac';

// Check if user can access a specific route
const canAccess = canAccessRoute(userRole, '/admin');
```

### Navigation

The `DashboardLayout` component automatically adjusts navigation based on user role:

- **All Users**: Home, Dashboard, Launch Token, Agents, Profile
- **Admin**: + Admin Dashboard
- **Dev**: + Dev Portal
- **Admin**: Gets both Admin Dashboard and Dev Portal access

## Adding New Roles

To add a new role:

1. Update `src/lib/rbac.ts`:
```typescript
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  DEV = 'dev',
  MODERATOR = 'moderator', // New role
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  // ... existing roles
  [UserRole.MODERATOR]: {
    role: UserRole.MODERATOR,
    label: 'Moderator',
    description: 'Content moderator',
    permissions: ['dashboard:view', 'content:moderate'],
  },
};
```

2. Add role detection logic in `getUserRole()`

3. Update navigation in `DashboardLayout.tsx`

4. Create role-specific page if needed

## Security Considerations

### Client-Side Protection
- Navigation is hidden based on role
- Pages check role and redirect if unauthorized
- All checks are performed on component mount

### Server-Side Protection (Recommended)
For production, add server-side checks:

```typescript
// pages/api/admin/users.ts
export default function handler(req, res) {
  const userRole = getUserRoleFromSession(req);
  
  if (userRole !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Handle request
}
```

### Best Practices

1. **Never rely solely on client-side checks** - Always validate on the server
2. **Use environment variables** - Never hardcode wallet addresses
3. **Rotate regularly** - Update role assignments as team changes
4. **Log access** - Track who accesses sensitive areas
5. **Use multi-sig** - For critical admin operations, require multiple signatures

## Testing Roles

### Local Development

1. Set test wallet addresses in `.env.local`:
```env
ADMIN_ADDRESSES=0xYourTestWallet
DEV_ADDRESSES=0xYourTestWallet
```

2. Connect with MetaMask or other wallet

3. Navigate to role-specific pages to test

### Testing Different Roles

To test different roles with the same wallet:
1. Add your wallet to different role lists in `.env.local`
2. Restart the dev server
3. The first matching role will be assigned (Admin > Dev > User)

## Troubleshooting

### Role Not Detected
- Check wallet address matches exactly (including case and 0x prefix)
- Verify environment variables are loaded
- Restart development server after changing .env
- Check browser console for role detection logs

### Can't Access Dashboard
- Ensure wallet is connected
- Verify you're using the correct wallet
- Check that your address is in the appropriate role list
- Try refreshing the page

### Navigation Not Updating
- Clear browser cache
- Disconnect and reconnect wallet
- Check that DashboardLayout is being used
- Verify useUserRole hook is called

## Future Enhancements

Potential improvements to the RBAC system:

1. **Database-backed roles** - Store roles in database instead of env vars
2. **Permission granularity** - More fine-grained permission controls
3. **Role hierarchy** - Define role inheritance (Admin inherits Dev permissions)
4. **Dynamic permissions** - Allow runtime permission changes
5. **Audit logging** - Track all access and permission changes
6. **Multi-tenancy** - Support for organization-based roles
7. **Time-limited access** - Temporary role assignments
8. **Two-factor auth** - Additional security for sensitive roles

---

**Last Updated**: 2026-01-20  
**Version**: 1.0.0  
**Maintainer**: SMSDAO Team
