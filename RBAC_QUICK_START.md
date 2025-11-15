# RBAC Quick Start Guide

## Installation & Setup (5 minutes)

### Step 1: Run Database Migration

Execute the SQL migration to create RBAC tables:

```bash
mysql -u your_username -p your_database < db/migrations/001_create_rbac_tables.sql
```

This will create:
- ✅ `permissions` table with all system permissions
- ✅ `roles` table with admin, agent, customer roles
- ✅ `role_permissions` mapping table
- ✅ `user_permissions` table for special overrides
- ✅ Default permissions seeded for all roles

### Step 2: Verify Tables Created

```sql
-- Check if tables exist
SHOW TABLES LIKE '%permissions%';
SHOW TABLES LIKE 'roles';

-- Verify permissions count
SELECT COUNT(*) FROM permissions;  -- Should be 50+

-- Verify roles
SELECT * FROM roles;  -- Should show admin, agent, customer
```

### Step 3: Test Permission System

The system is now ready to use! No code changes needed for basic functionality.

## Usage (2 minutes to implement)

### Protect a Route with Permission

```javascript
// In your route file
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../config/permissions.js';

// Before (role-based)
router.get('/users', authenticateToken, requireRole('admin'), getAllUsers);

// After (permission-based) - More flexible!
router.get('/users', 
  authenticateToken, 
  requirePermission(PERMISSIONS.USER_READ_ALL), 
  getAllUsers
);
```

### Common Patterns

#### 1. Admin-Only Route
```javascript
import { requireAdmin } from '../middleware/rbac.middleware.js';

router.delete('/users/:id', authenticateToken, requireAdmin, deleteUser);
```

#### 2. User Can Update Own Profile OR Admin Can Update Any
```javascript
import { requireOwnershipOrPermission } from '../middleware/rbac.middleware.js';

router.put('/users/:id',
  authenticateToken,
  requireOwnershipOrPermission(
    PERMISSIONS.USER_UPDATE,      // Own profile
    PERMISSIONS.USER_UPDATE_ANY,  // Any profile
    (req) => req.params.id
  ),
  updateUser
);
```

#### 3. Multiple Permissions (User Needs ALL)
```javascript
import { requireAllPermissions } from '../middleware/rbac.middleware.js';

router.post('/users/:id/promote',
  authenticateToken,
  requireAllPermissions(
    PERMISSIONS.USER_UPDATE_ANY,
    PERMISSIONS.USER_ACTIVATE
  ),
  promoteUser
);
```

#### 4. Multiple Permissions (User Needs ANY)
```javascript
import { requireAnyPermission } from '../middleware/rbac.middleware.js';

router.get('/bookings/:id',
  authenticateToken,
  requireAnyPermission(
    PERMISSIONS.BOOKING_READ,      // Own bookings
    PERMISSIONS.BOOKING_READ_ALL   // All bookings
  ),
  getBooking
);
```

## Common Permissions Reference

### User Management
```javascript
PERMISSIONS.USER_CREATE         // Create users
PERMISSIONS.USER_READ           // View own profile
PERMISSIONS.USER_READ_ALL       // View all profiles
PERMISSIONS.USER_UPDATE         // Update own profile
PERMISSIONS.USER_UPDATE_ANY     // Update any profile
```

### Agent Management
```javascript
PERMISSIONS.AGENT_READ          // View own agent profile
PERMISSIONS.AGENT_READ_ALL      // View all agents
PERMISSIONS.AGENT_UPDATE        // Update own profile
PERMISSIONS.AGENT_APPROVE       // Approve agent applications (admin)
```

### Category Management
```javascript
PERMISSIONS.CATEGORY_CREATE     // Create categories (admin)
PERMISSIONS.CATEGORY_READ       // View categories (all)
PERMISSIONS.CATEGORY_UPDATE     // Update categories (admin)
PERMISSIONS.CATEGORY_DELETE     // Delete categories (admin)
```

### Booking Management
```javascript
PERMISSIONS.BOOKING_CREATE      // Create bookings (customer)
PERMISSIONS.BOOKING_READ        // View own bookings
PERMISSIONS.BOOKING_READ_ALL    // View all bookings (admin)
PERMISSIONS.BOOKING_COMPLETE    // Complete bookings (agent)
PERMISSIONS.BOOKING_ASSIGN      // Assign bookings (admin)
```

## Default Role Permissions

### Admin
✅ Full access to everything

### Agent
✅ Own profile management
✅ View categories
✅ Manage assigned bookings
✅ Complete bookings
✅ View customer info

### Customer
✅ Own profile management
✅ Address management
✅ View categories & agents
✅ Create & manage bookings
✅ File upload

## Testing Your Implementation

### Test 1: Admin Access
```bash
# Login as admin
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Access admin-only route
curl http://localhost:3000/api/users/all \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
# Should return 200 OK
```

### Test 2: Customer Access (Should Fail)
```bash
# Login as customer
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"password"}'

# Try to access admin-only route
curl http://localhost:3000/api/users/all \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN"
# Should return 403 Forbidden
```

### Test 3: Check User Permissions
```bash
# Get current user's permissions
curl http://localhost:3000/api/users/me/permissions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Advanced: Grant Special Permission to User

Sometimes you need to give a specific user temporary elevated permissions:

```sql
-- Grant user #123 permission to update any user for 7 days
CALL sp_grant_user_permission(
  123,                                -- user_id
  'user:update:any',                  -- permission
  1,                                  -- granted_by (your admin ID)
  DATE_ADD(NOW(), INTERVAL 7 DAY),    -- expires in 7 days
  'Temporary access for data migration'  -- reason
);

-- Check if it worked
SELECT * FROM user_permissions WHERE user_id = 123;

-- Revoke it manually if needed
CALL sp_revoke_user_permission(123, 'user:update:any');
```

## Troubleshooting

### Error: "Insufficient permissions"
- ✅ Check user role: `SELECT role FROM users WHERE id = YOUR_ID;`
- ✅ Verify permission exists: `SELECT * FROM permissions WHERE name = 'permission:name';`
- ✅ Check role has permission: `SELECT * FROM v_user_effective_permissions WHERE user_id = YOUR_ID;`

### Error: "Authentication required"
- ✅ Ensure `authenticateToken` middleware is before permission check
- ✅ Verify token is valid and not expired
- ✅ Check token is in header: `Authorization: Bearer YOUR_TOKEN`

### Permission check not working
- ✅ Import from correct path: `from '../config/permissions.js'`
- ✅ Use `PERMISSIONS.NAME` constant, not string
- ✅ Ensure database migration ran successfully

## Migration Checklist

Migrate your existing routes gradually:

- [ ] Run database migration
- [ ] Test existing authentication still works
- [ ] Update 1-2 admin routes to use `requireAdmin`
- [ ] Update user profile routes to use `requireOwnershipOrPermission`
- [ ] Add permission endpoint for frontend
- [ ] Update remaining routes as needed
- [ ] Test all role combinations
- [ ] Document custom permissions

## Next Steps

1. ✅ See full examples: `src/routes/examples.rbac.routes.js`
2. ✅ Read detailed guide: `RBAC_IMPLEMENTATION_GUIDE.md`
3. ✅ Review all permissions: `src/config/permissions.js`
4. ✅ Check middleware options: `src/middleware/rbac.middleware.js`

## Need Help?

- Review example routes in `src/routes/examples.rbac.routes.js`
- Check permission mappings in `src/config/permissions.js`
- Read full documentation in `RBAC_IMPLEMENTATION_GUIDE.md`
- Verify database setup with provided SQL queries

---

**Setup Time**: ~5 minutes  
**Integration Time**: ~2 minutes per route  
**Status**: ✅ Production Ready
