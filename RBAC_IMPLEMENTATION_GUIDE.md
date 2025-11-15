# RBAC (Role-Based Access Control) Implementation Guide

## Overview

This project now includes a comprehensive Role-Based Access Control (RBAC) system that allows fine-grained permission management for different user roles.

## Architecture

The RBAC system consists of:

1. **Permissions Configuration** (`src/config/permissions.js`)
   - Defines all available permissions
   - Maps permissions to roles
   - Provides helper functions for permission checking

2. **RBAC Middleware** (`src/middleware/rbac.middleware.js`)
   - Route protection based on permissions
   - Ownership verification
   - Programmatic permission checking

3. **Database Schema** (`db/migrations/001_create_rbac_tables.sql`)
   - Stores permissions, roles, and their mappings
   - Supports user-specific permission overrides
   - Includes views and stored procedures

4. **Authentication Middleware** (`src/middleware/auth.middleware.js`)
   - Enhanced to work seamlessly with RBAC
   - Backward compatible with existing code

## Roles and Default Permissions

### Admin
Full system access including:
- All user management operations
- All agent management operations
- Category CRUD operations
- Address management (any user)
- Booking management (any booking)
- Analytics and reporting
- System configuration
- File management

### Agent (Service Provider)
Limited access for service providers:
- Read/update own profile
- View categories
- Manage assigned bookings
- Complete bookings
- View customer details (for bookings)
- Upload/delete own files

### Customer
End-user access:
- Read/update own profile
- Manage own addresses
- View categories
- Discover and view agents
- Create and manage own bookings
- Upload/delete own files

## Database Setup

### 1. Run the Migration

Execute the SQL migration file to create the RBAC tables:

```bash
# Using MySQL CLI
mysql -u your_username -p your_database < db/migrations/001_create_rbac_tables.sql

# Or using a database client
# Import and execute: db/migrations/001_create_rbac_tables.sql
```

### 2. Tables Created

- **permissions**: All available permissions
- **roles**: System roles (admin, agent, customer)
- **role_permissions**: Maps permissions to roles
- **user_permissions**: Special permissions for individual users

### 3. Views and Procedures

- **v_user_effective_permissions**: View showing all effective permissions per user
- **sp_check_user_permission**: Stored procedure to check user permissions
- **sp_grant_user_permission**: Grant special permission to a user
- **sp_revoke_user_permission**: Revoke special permission from a user

## Usage Examples

### 1. Basic Permission Check

```javascript
import { PERMISSIONS } from '../config/permissions.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

// Only users with USER_CREATE permission can access
router.post('/users', 
  authenticateToken, 
  requirePermission(PERMISSIONS.USER_CREATE), 
  createUser
);
```

### 2. Multiple Permissions (ALL Required)

```javascript
import { requireAllPermissions } from '../middleware/rbac.middleware.js';

// User must have BOTH permissions
router.put('/users/:id/role',
  authenticateToken,
  requireAllPermissions(
    PERMISSIONS.USER_UPDATE_ANY, 
    PERMISSIONS.USER_ACTIVATE
  ),
  updateUserRole
);
```

### 3. Multiple Permissions (ANY Required)

```javascript
import { requireAnyPermission } from '../middleware/rbac.middleware.js';

// User needs at least ONE permission
router.get('/users/:id',
  authenticateToken,
  requireAnyPermission(
    PERMISSIONS.USER_READ,      // Can read own profile
    PERMISSIONS.USER_READ_ALL   // OR can read any profile
  ),
  getUserById
);
```

### 4. Ownership or Permission Check

```javascript
import { requireOwnershipOrPermission } from '../middleware/rbac.middleware.js';

// Users can update their own profile OR admins can update any
router.put('/users/:id',
  authenticateToken,
  requireOwnershipOrPermission(
    PERMISSIONS.USER_UPDATE,      // Permission for own resource
    PERMISSIONS.USER_UPDATE_ANY,  // Permission for any resource
    (req) => req.params.id        // Function to get resource owner ID
  ),
  updateUser
);
```

### 5. Admin-Only Route

```javascript
import { requireAdmin } from '../middleware/rbac.middleware.js';

// Shortcut for admin-only endpoints
router.delete('/users/:id',
  authenticateToken,
  requireAdmin,
  deleteUser
);
```

### 6. Attach User Permissions (for Frontend)

```javascript
import { attachUserPermissions } from '../middleware/rbac.middleware.js';

// Include user permissions in response
router.get('/users/me/permissions',
  authenticateToken,
  attachUserPermissions,
  (req, res) => {
    res.json({
      user: req.user,
      permissions: req.userPermissions
    });
  }
);
```

### 7. Programmatic Permission Check in Controller

```javascript
import { checkPermission, checkOwnership } from '../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../config/permissions.js';

export const updateUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  
  // Check if user can update any profile OR owns this profile
  const canUpdate = 
    hasPermission(req.user.role, PERMISSIONS.USER_UPDATE_ANY) ||
    (hasPermission(req.user.role, PERMISSIONS.USER_UPDATE) && 
     req.user.id === userId);
  
  if (!canUpdate) {
    throw new ApiError(403, 'Insufficient permissions');
  }
  
  // Perform update...
});
```

## Available Permissions

### User Management
- `user:create` - Create new users
- `user:read` - View own profile
- `user:read:all` - View all profiles
- `user:update` - Update own profile
- `user:update:any` - Update any profile
- `user:delete` - Delete own account
- `user:delete:any` - Delete any account
- `user:verify` - Verify email addresses
- `user:activate` - Activate accounts
- `user:deactivate` - Deactivate accounts

### Agent Management
- `agent:create` - Create agents
- `agent:read` - View own profile
- `agent:read:all` - View all agents
- `agent:update` - Update own profile
- `agent:update:any` - Update any agent
- `agent:delete` - Delete own account
- `agent:delete:any` - Delete any agent
- `agent:verify` - Verify documents
- `agent:approve` - Approve applications
- `agent:reject` - Reject applications
- `agent:activate` - Activate agents
- `agent:deactivate` - Deactivate agents

### Category Management
- `category:create` - Create categories
- `category:read` - View categories
- `category:update` - Update categories
- `category:delete` - Delete categories
- `category:activate` - Activate categories
- `category:deactivate` - Deactivate categories

### Address Management
- `address:create` - Create addresses
- `address:read` - View own addresses
- `address:read:all` - View all addresses
- `address:update` - Update own addresses
- `address:update:any` - Update any address
- `address:delete` - Delete own addresses
- `address:delete:any` - Delete any address

### Booking Management
- `booking:create` - Create bookings
- `booking:read` - View own bookings
- `booking:read:all` - View all bookings
- `booking:update` - Update own bookings
- `booking:update:any` - Update any booking
- `booking:delete` - Delete own bookings
- `booking:delete:any` - Delete any booking
- `booking:assign` - Assign to agents
- `booking:complete` - Mark complete
- `booking:cancel` - Cancel bookings

### Analytics & Reporting
- `analytics:view` - View analytics
- `analytics:export` - Export data

### System Configuration
- `system:config:read` - View config
- `system:config:update` - Update config

### File Management
- `file:upload` - Upload files
- `file:delete` - Delete own files
- `file:delete:any` - Delete any file

## Advanced Features

### 1. Grant Special Permission to User

```sql
-- Grant temporary permission to a specific user
CALL sp_grant_user_permission(
  123,                              -- user_id
  'user:update:any',                -- permission_name
  1,                                -- granted_by (admin user id)
  DATE_ADD(NOW(), INTERVAL 7 DAY),  -- expires_on (expires in 7 days)
  'Temporary admin access for user migration'  -- reason
);
```

### 2. Revoke Special Permission

```sql
-- Revoke special permission
CALL sp_revoke_user_permission(123, 'user:update:any');
```

### 3. Check User Permission

```sql
-- Check if user has permission
SET @has_permission = FALSE;
CALL sp_check_user_permission(123, 'user:create', @has_permission);
SELECT @has_permission;
```

### 4. View All User Permissions

```sql
-- Get all effective permissions for a user
SELECT * FROM v_user_effective_permissions 
WHERE user_id = 123;
```

## Helper Functions

The permission config provides several helper functions:

```javascript
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getRolePermissions,
  isResourceOwner,
  canPerformAction
} from '../config/permissions.js';

// Check single permission
hasPermission('admin', PERMISSIONS.USER_CREATE); // true

// Check all permissions
hasAllPermissions('customer', [
  PERMISSIONS.ADDRESS_CREATE,
  PERMISSIONS.ADDRESS_READ
]); // true

// Check any permission
hasAnyPermission('agent', [
  PERMISSIONS.BOOKING_READ_ALL,
  PERMISSIONS.BOOKING_READ
]); // true

// Get all role permissions
const permissions = getRolePermissions('admin'); // Array of all admin permissions

// Check ownership
isResourceOwner(userId, resourceOwnerId); // true/false

// Complex permission check
canPerformAction({
  role: 'customer',
  permission: PERMISSIONS.USER_UPDATE_ANY,
  ownerPermission: PERMISSIONS.USER_UPDATE,
  userId: 123,
  resourceOwnerId: 123
}); // true
```

## Migration from Role-Based to Permission-Based

If you have existing routes using `requireRole`, you can migrate gradually:

```javascript
// Old way (still supported)
router.get('/agents', authenticateToken, requireRole('admin', 'agent'), getAgents);

// New way (recommended)
router.get('/agents', 
  authenticateToken, 
  requirePermission(PERMISSIONS.AGENT_READ_ALL), 
  getAgents
);
```

## Best Practices

1. **Use Permission-Based Checks**: Prefer `requirePermission` over `requireRole` for new code
2. **Granular Permissions**: Break down actions into specific permissions
3. **Resource Ownership**: Use `requireOwnershipOrPermission` for user-owned resources
4. **Attach Permissions**: Use `attachUserPermissions` for frontend permission checks
5. **Document Permissions**: Add comments explaining why specific permissions are required
6. **Test Thoroughly**: Test all permission combinations and edge cases
7. **Audit Trail**: Log permission changes and special grants

## Security Considerations

1. **Token Validation**: Always use `authenticateToken` before permission checks
2. **Ownership Verification**: Verify resource ownership in database, not just from request
3. **Permission Expiry**: Use time-limited permissions for temporary access
4. **Audit Logs**: Consider logging all permission checks and changes
5. **Regular Reviews**: Periodically review and update role permissions
6. **Least Privilege**: Grant minimum permissions necessary

## Troubleshooting

### Permission Denied Error

```
HTTP 403: Insufficient permissions. Required permission: user:create
```

**Solution**: Check if the user's role has the required permission in `src/config/permissions.js`

### User Not Authenticated

```
HTTP 401: Authentication required
```

**Solution**: Ensure `authenticateToken` middleware is called before permission checks

### Ownership Check Failing

```
HTTP 403: You do not have permission to access this resource
```

**Solution**: Verify the `getResourceOwnerId` function returns the correct owner ID

## Testing

Test permission checks in your API tests:

```javascript
// Test admin can access
const adminResponse = await request(app)
  .get('/api/users')
  .set('Authorization', `Bearer ${adminToken}`);
expect(adminResponse.status).toBe(200);

// Test customer cannot access
const customerResponse = await request(app)
  .get('/api/users')
  .set('Authorization', `Bearer ${customerToken}`);
expect(customerResponse.status).toBe(403);
```

## Future Enhancements

Potential improvements:
- Dynamic permission management UI
- Permission groups/bundles
- Time-based permissions
- IP-based restrictions
- Two-factor authentication for sensitive operations
- Permission inheritance hierarchies
- Audit log viewer

## Support

For questions or issues with RBAC implementation:
1. Review the example routes in `src/routes/examples.rbac.routes.js`
2. Check the permission mappings in `src/config/permissions.js`
3. Verify database schema is properly set up
4. Test with different user roles

---

**Last Updated**: November 7, 2025
**Version**: 1.0.0
