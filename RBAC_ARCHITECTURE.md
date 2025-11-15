# RBAC System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                                   │
│                    (HTTP with JWT Token)                                 │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION LAYER                                 │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  authenticateToken (auth.middleware.js)                        │     │
│  │  • Verify JWT token                                            │     │
│  │  • Check if token is blacklisted                               │     │
│  │  • Fetch user/agent from database                              │     │
│  │  • Attach req.user with role info                              │     │
│  └────────────────────────────────────────────────────────────────┘     │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    AUTHORIZATION LAYER (RBAC)                            │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  RBAC Middleware (rbac.middleware.js)                          │     │
│  │                                                                 │     │
│  │  Options:                                                       │     │
│  │  1. requirePermission(permission)                              │     │
│  │  2. requireAllPermissions(...permissions)                      │     │
│  │  3. requireAnyPermission(...permissions)                       │     │
│  │  4. requireOwnershipOrPermission(own, any, getOwnerId)         │     │
│  │  5. requireAdmin()                                             │     │
│  │  6. requireRole(...roles)                                      │     │
│  │                                                                 │     │
│  │  Checks against:                                                │     │
│  │  • PERMISSIONS config (permissions.js)                         │     │
│  │  • ROLE_PERMISSIONS mapping                                    │     │
│  │  • Resource ownership (if applicable)                          │     │
│  └────────────────────────────────────────────────────────────────┘     │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                   ┌─────────┴─────────┐
                   │                   │
             PASS  │                   │  FAIL
                   ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │   CONTROLLER     │  │  HTTP 403        │
        │   Execute Logic  │  │  Forbidden       │
        └──────────────────┘  └──────────────────┘
                   │
                   ▼
        ┌──────────────────┐
        │   RESPONSE       │
        │   Return Data    │
        └──────────────────┘


═══════════════════════════════════════════════════════════════════════════

DATABASE SCHEMA RELATIONSHIPS

┌──────────────┐         ┌──────────────────────┐         ┌──────────────┐
│   users      │         │  role_permissions    │         │ permissions  │
│──────────────│         │──────────────────────│         │──────────────│
│ id (PK)      │         │ id (PK)              │         │ id (PK)      │
│ name         │         │ role_id (FK)         │         │ name         │
│ email        │         │ permission_id (FK)   │         │ description  │
│ role ────────┼────┐    │ granted_on           │    ┌────│ category     │
│ ...          │    │    │ granted_by           │    │    │ is_active    │
└──────────────┘    │    └──────────────────────┘    │    └──────────────┘
                    │              ▲                 │
                    │              │                 │
                    ▼              │                 │
┌──────────────┐   │    ┌─────────┴──────┐          │
│   roles      │───┘    │  Mapping Table │          │
│──────────────│        └────────────────┘          │
│ id (PK)      │                                     │
│ name         │                                     │
│ display_name │                                     │
│ description  │                                     │
│ is_active    │                                     │
└──────────────┘                                     │
                                                     │
┌──────────────┐         ┌──────────────────────┐   │
│   users      │         │  user_permissions    │   │
│──────────────│         │──────────────────────│   │
│ id (PK)   ───┼────────▶│ user_id (FK)         │   │
└──────────────┘         │ permission_id (FK)───┼───┘
                         │ is_granted           │
                         │ granted_on           │
                         │ granted_by           │
                         │ expires_on           │
                         │ reason               │
                         └──────────────────────┘
                         
                         User-Specific Overrides
                         (Special Permissions)


═══════════════════════════════════════════════════════════════════════════

PERMISSION CHECK FLOW

User Request
    │
    ▼
┌─────────────────────────────────────────────┐
│ 1. Get user role from req.user.role         │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ 2. Load role permissions from config        │
│    ROLE_PERMISSIONS[role]                   │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ 3. Check if permission in role permissions  │
└───────────────────┬─────────────────────────┘
                    │
          ┌─────────┴─────────┐
          │                   │
    YES   │                   │  NO
          ▼                   ▼
    ┌──────────┐      ┌──────────────────┐
    │  ALLOW   │      │ Check DB for     │
    │          │      │ user_permissions │
    └──────────┘      └────────┬─────────┘
                               │
                     ┌─────────┴─────────┐
                     │                   │
               YES   │                   │  NO
                     ▼                   ▼
               ┌──────────┐      ┌──────────┐
               │  ALLOW   │      │  DENY    │
               │          │      │  (403)   │
               └──────────┘      └──────────┘


═══════════════════════════════════════════════════════════════════════════

ROLE PERMISSION MATRIX

Permission Category          │ Admin │ Agent │ Customer │
────────────────────────────┼───────┼───────┼──────────┤
User: Create                 │   ✓   │       │          │
User: Read (Own)             │   ✓   │   ✓   │    ✓     │
User: Read (All)             │   ✓   │       │          │
User: Update (Own)           │   ✓   │       │    ✓     │
User: Update (Any)           │   ✓   │       │          │
User: Delete (Any)           │   ✓   │       │          │
────────────────────────────┼───────┼───────┼──────────┤
Agent: Read (Own)            │   ✓   │   ✓   │          │
Agent: Read (All)            │   ✓   │       │    ✓     │
Agent: Update (Own)          │   ✓   │   ✓   │          │
Agent: Update (Any)          │   ✓   │       │          │
Agent: Approve               │   ✓   │       │          │
Agent: Deactivate            │   ✓   │       │          │
────────────────────────────┼───────┼───────┼──────────┤
Category: Create             │   ✓   │       │          │
Category: Read               │   ✓   │   ✓   │    ✓     │
Category: Update             │   ✓   │       │          │
Category: Delete             │   ✓   │       │          │
────────────────────────────┼───────┼───────┼──────────┤
Address: Create              │   ✓   │       │    ✓     │
Address: Read (Own)          │   ✓   │       │    ✓     │
Address: Read (All)          │   ✓   │       │          │
Address: Update (Own)        │   ✓   │       │    ✓     │
Address: Update (Any)        │   ✓   │       │          │
Address: Delete (Own)        │   ✓   │       │    ✓     │
────────────────────────────┼───────┼───────┼──────────┤
Booking: Create              │   ✓   │       │    ✓     │
Booking: Read (Own)          │   ✓   │   ✓   │    ✓     │
Booking: Read (All)          │   ✓   │       │          │
Booking: Update (Own)        │   ✓   │   ✓   │    ✓     │
Booking: Assign              │   ✓   │       │          │
Booking: Complete            │   ✓   │   ✓   │          │
Booking: Cancel              │   ✓   │       │    ✓     │
────────────────────────────┼───────┼───────┼──────────┤
Analytics: View              │   ✓   │       │          │
Analytics: Export            │   ✓   │       │          │
────────────────────────────┼───────┼───────┼──────────┤
System: Config Read          │   ✓   │       │          │
System: Config Update        │   ✓   │       │          │
────────────────────────────┼───────┼───────┼──────────┤
File: Upload                 │   ✓   │   ✓   │    ✓     │
File: Delete (Own)           │   ✓   │   ✓   │    ✓     │
File: Delete (Any)           │   ✓   │       │          │


═══════════════════════════════════════════════════════════════════════════

MIDDLEWARE USAGE EXAMPLES

┌─────────────────────────────────────────────────────────────────────┐
│  SCENARIO 1: Single Permission Check                                │
├─────────────────────────────────────────────────────────────────────┤
│  router.get('/users',                                               │
│    authenticateToken,                                               │
│    requirePermission(PERMISSIONS.USER_READ_ALL),                    │
│    getAllUsers                                                      │
│  );                                                                 │
│                                                                     │
│  ✓ Admin: PASS (has USER_READ_ALL)                                 │
│  ✗ Agent: FAIL (no USER_READ_ALL)                                  │
│  ✗ Customer: FAIL (no USER_READ_ALL)                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  SCENARIO 2: Multiple Permissions (ALL required)                    │
├─────────────────────────────────────────────────────────────────────┤
│  router.put('/system/config',                                       │
│    authenticateToken,                                               │
│    requireAllPermissions(                                           │
│      PERMISSIONS.SYSTEM_CONFIG_READ,                                │
│      PERMISSIONS.SYSTEM_CONFIG_UPDATE                               │
│    ),                                                               │
│    updateConfig                                                     │
│  );                                                                 │
│                                                                     │
│  ✓ Admin: PASS (has both)                                          │
│  ✗ Agent: FAIL (has neither)                                       │
│  ✗ Customer: FAIL (has neither)                                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  SCENARIO 3: Ownership or Permission                                │
├─────────────────────────────────────────────────────────────────────┤
│  router.put('/users/:id',                                           │
│    authenticateToken,                                               │
│    requireOwnershipOrPermission(                                    │
│      PERMISSIONS.USER_UPDATE,        // Own profile                │
│      PERMISSIONS.USER_UPDATE_ANY,    // Any profile                │
│      (req) => req.params.id          // Owner ID getter            │
│    ),                                                               │
│    updateUser                                                       │
│  );                                                                 │
│                                                                     │
│  ✓ Admin updating any user: PASS (has USER_UPDATE_ANY)             │
│  ✓ Customer #5 updating self: PASS (owns resource, has USER_UPDATE)│
│  ✗ Customer #5 updating user #10: FAIL (not owner, no UPDATE_ANY)  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  SCENARIO 4: Any Permission (OR logic)                              │
├─────────────────────────────────────────────────────────────────────┤
│  router.get('/bookings/:id',                                        │
│    authenticateToken,                                               │
│    requireAnyPermission(                                            │
│      PERMISSIONS.BOOKING_READ,       // Own bookings               │
│      PERMISSIONS.BOOKING_READ_ALL    // All bookings               │
│    ),                                                               │
│    getBooking                                                       │
│  );                                                                 │
│                                                                     │
│  ✓ Admin: PASS (has BOOKING_READ_ALL)                              │
│  ✓ Agent: PASS (has BOOKING_READ)                                  │
│  ✓ Customer: PASS (has BOOKING_READ)                               │
└─────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════

FILE STRUCTURE

app-backend/
├── src/
│   ├── config/
│   │   └── permissions.js          ← Permission definitions & mappings
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js      ← JWT authentication
│   │   └── rbac.middleware.js      ← RBAC permission checks
│   │
│   ├── models/
│   │   ├── user.model.js           ← Existing user model
│   │   ├── agent.model.js          ← Existing agent model
│   │   └── rbac.model.js           ← RBAC Sequelize models (optional)
│   │
│   ├── routes/
│   │   ├── user.routes.js          ← Updated with RBAC
│   │   ├── agent.routes.js         ← Can be updated with RBAC
│   │   └── examples.rbac.routes.js ← 30+ usage examples
│   │
│   └── constants.js                ← Added RBAC_MESSAGES
│
├── db/
│   └── migrations/
│       └── 001_create_rbac_tables.sql  ← Database schema
│
├── RBAC_IMPLEMENTATION_GUIDE.md    ← Full documentation
├── RBAC_QUICK_START.md             ← Quick reference
├── RBAC_SUMMARY.md                 ← Implementation summary
└── RBAC_ARCHITECTURE.md            ← This file


═══════════════════════════════════════════════════════════════════════════
```
