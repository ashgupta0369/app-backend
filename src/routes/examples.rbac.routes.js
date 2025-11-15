/**
 * Example Routes with RBAC Implementation
 * 
 * This file demonstrates how to use RBAC middleware to protect routes
 * Copy the patterns from this file to your actual route files
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireOwnershipOrPermission,
  requireAdmin,
  attachUserPermissions
} from '../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = Router();

// =====================================================
// USER ROUTES - Examples
// =====================================================

/**
 * Example 1: Public route - no authentication required
 * Anyone can register
 */
router.post('/users/register', (req, res) => {
  // Registration logic
});

/**
 * Example 2: Basic authentication - user must be logged in
 * Any authenticated user can view their own profile
 */
router.get('/users/me', authenticateToken, (req, res) => {
  // Get current user logic
});

/**
 * Example 3: Permission-based route
 * Only users with specific permission can access
 */
router.get(
  '/users',
  authenticateToken,
  requirePermission(PERMISSIONS.USER_READ_ALL),
  (req, res) => {
    // Get all users logic - only admin has this permission
  }
);

/**
 * Example 4: Admin-only route
 * Shortcut for admin-specific endpoints
 */
router.post(
  '/users/:id/verify',
  authenticateToken,
  requireAdmin,
  (req, res) => {
    // Verify user logic - only admin can verify users
  }
);

/**
 * Example 5: Multiple permissions required (ALL)
 * User must have both permissions
 */
router.put(
  '/users/:id/role',
  authenticateToken,
  requireAllPermissions(PERMISSIONS.USER_UPDATE_ANY, PERMISSIONS.USER_ACTIVATE),
  (req, res) => {
    // Update user role logic - requires both permissions
  }
);

/**
 * Example 6: Any of multiple permissions (OR)
 * User needs at least one of the specified permissions
 */
router.get(
  '/users/:id',
  authenticateToken,
  requireAnyPermission(PERMISSIONS.USER_READ, PERMISSIONS.USER_READ_ALL),
  (req, res) => {
    // Get user by ID - can be own profile or any if admin
  }
);

/**
 * Example 7: Ownership or permission check
 * Users can update their own profile OR admins can update any profile
 */
router.put(
  '/users/:id',
  authenticateToken,
  requireOwnershipOrPermission(
    PERMISSIONS.USER_UPDATE,      // Permission for own resource
    PERMISSIONS.USER_UPDATE_ANY,  // Permission for any resource
    (req) => req.params.id        // Function to get resource owner ID
  ),
  (req, res) => {
    // Update user logic
  }
);

/**
 * Example 8: Attach user permissions to response
 * Useful for frontend to know what user can do
 */
router.get(
  '/users/me/permissions',
  authenticateToken,
  attachUserPermissions,
  (req, res) => {
    res.json({
      user: req.user,
      permissions: req.userPermissions
    });
  }
);

// =====================================================
// AGENT ROUTES - Examples
// =====================================================

/**
 * Example 9: Agent registration - public
 */
router.post('/agents/register', (req, res) => {
  // Agent registration logic
});

/**
 * Example 10: Agent profile - own or admin
 */
router.get(
  '/agents/:id',
  authenticateToken,
  requireAnyPermission(PERMISSIONS.AGENT_READ, PERMISSIONS.AGENT_READ_ALL),
  (req, res) => {
    // Get agent by ID
  }
);

/**
 * Example 11: Approve agent - admin only
 */
router.post(
  '/agents/:id/approve',
  authenticateToken,
  requirePermission(PERMISSIONS.AGENT_APPROVE),
  (req, res) => {
    // Approve agent logic - only admin
  }
);

/**
 * Example 12: Update agent - own profile or admin
 */
router.put(
  '/agents/:id',
  authenticateToken,
  requireOwnershipOrPermission(
    PERMISSIONS.AGENT_UPDATE,
    PERMISSIONS.AGENT_UPDATE_ANY,
    (req) => req.params.id
  ),
  (req, res) => {
    // Update agent logic
  }
);

// =====================================================
// CATEGORY ROUTES - Examples
// =====================================================

/**
 * Example 13: Read categories - any authenticated user
 */
router.get(
  '/categories',
  authenticateToken,
  requirePermission(PERMISSIONS.CATEGORY_READ),
  (req, res) => {
    // Get all categories - all roles have this permission
  }
);

/**
 * Example 14: Create category - admin only
 */
router.post(
  '/categories',
  authenticateToken,
  requirePermission(PERMISSIONS.CATEGORY_CREATE),
  (req, res) => {
    // Create category logic - only admin
  }
);

/**
 * Example 15: Update category - admin only
 */
router.put(
  '/categories/:id',
  authenticateToken,
  requireAllPermissions(PERMISSIONS.CATEGORY_READ, PERMISSIONS.CATEGORY_UPDATE),
  (req, res) => {
    // Update category logic
  }
);

/**
 * Example 16: Delete category - admin only
 */
router.delete(
  '/categories/:id',
  authenticateToken,
  requirePermission(PERMISSIONS.CATEGORY_DELETE),
  (req, res) => {
    // Delete category logic - only admin
  }
);

// =====================================================
// ADDRESS ROUTES - Examples
// =====================================================

/**
 * Example 17: Create address - customer can create own
 */
router.post(
  '/addresses',
  authenticateToken,
  requirePermission(PERMISSIONS.ADDRESS_CREATE),
  (req, res) => {
    // Create address logic
  }
);

/**
 * Example 18: Get addresses - own or all (admin)
 */
router.get(
  '/addresses',
  authenticateToken,
  requireAnyPermission(PERMISSIONS.ADDRESS_READ, PERMISSIONS.ADDRESS_READ_ALL),
  (req, res) => {
    // Get addresses logic - filter based on permission
    if (req.user.role === 'admin') {
      // Return all addresses
    } else {
      // Return only user's addresses
    }
  }
);

/**
 * Example 19: Update address - own or admin
 */
router.put(
  '/addresses/:id',
  authenticateToken,
  requireOwnershipOrPermission(
    PERMISSIONS.ADDRESS_UPDATE,
    PERMISSIONS.ADDRESS_UPDATE_ANY,
    async (req) => {
      // Fetch address and return owner ID
      // const address = await Address.findByPk(req.params.id);
      // return address.userId;
      return req.body.userId; // Simplified example
    }
  ),
  (req, res) => {
    // Update address logic
  }
);

/**
 * Example 20: Delete address - own or admin
 */
router.delete(
  '/addresses/:id',
  authenticateToken,
  requireOwnershipOrPermission(
    PERMISSIONS.ADDRESS_DELETE,
    PERMISSIONS.ADDRESS_DELETE_ANY,
    async (req) => {
      // Fetch and return owner ID
      return req.body.userId; // Simplified
    }
  ),
  (req, res) => {
    // Delete address logic
  }
);

// =====================================================
// BOOKING ROUTES - Examples (for future implementation)
// =====================================================

/**
 * Example 21: Create booking - customer only
 */
router.post(
  '/bookings',
  authenticateToken,
  requirePermission(PERMISSIONS.BOOKING_CREATE),
  (req, res) => {
    // Create booking logic
  }
);

/**
 * Example 22: Get bookings - own or all based on role
 */
router.get(
  '/bookings',
  authenticateToken,
  requireAnyPermission(PERMISSIONS.BOOKING_READ, PERMISSIONS.BOOKING_READ_ALL),
  (req, res) => {
    // Get bookings logic
  }
);

/**
 * Example 23: Assign booking - admin only
 */
router.post(
  '/bookings/:id/assign',
  authenticateToken,
  requirePermission(PERMISSIONS.BOOKING_ASSIGN),
  (req, res) => {
    // Assign booking to agent - admin only
  }
);

/**
 * Example 24: Complete booking - agent or admin
 */
router.post(
  '/bookings/:id/complete',
  authenticateToken,
  requirePermission(PERMISSIONS.BOOKING_COMPLETE),
  (req, res) => {
    // Complete booking - agent or admin
  }
);

/**
 * Example 25: Cancel booking - customer or admin
 */
router.post(
  '/bookings/:id/cancel',
  authenticateToken,
  requirePermission(PERMISSIONS.BOOKING_CANCEL),
  (req, res) => {
    // Cancel booking
  }
);

// =====================================================
// ANALYTICS ROUTES - Examples
// =====================================================

/**
 * Example 26: View analytics - admin only
 */
router.get(
  '/analytics/dashboard',
  authenticateToken,
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  (req, res) => {
    // Get analytics data - admin only
  }
);

/**
 * Example 27: Export analytics - admin only
 */
router.get(
  '/analytics/export',
  authenticateToken,
  requireAllPermissions(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_EXPORT),
  (req, res) => {
    // Export analytics - admin only
  }
);

// =====================================================
// SYSTEM CONFIGURATION ROUTES - Examples
// =====================================================

/**
 * Example 28: Read system config - admin only
 */
router.get(
  '/system/config',
  authenticateToken,
  requirePermission(PERMISSIONS.SYSTEM_CONFIG_READ),
  (req, res) => {
    // Get system configuration
  }
);

/**
 * Example 29: Update system config - admin only
 */
router.put(
  '/system/config',
  authenticateToken,
  requireAllPermissions(PERMISSIONS.SYSTEM_CONFIG_READ, PERMISSIONS.SYSTEM_CONFIG_UPDATE),
  (req, res) => {
    // Update system configuration
  }
);

// =====================================================
// PROGRAMMATIC PERMISSION CHECKING IN CONTROLLERS
// =====================================================

/**
 * Example 30: Check permissions within controller
 */
router.post('/complex-operation', authenticateToken, async (req, res) => {
  const { checkPermission, checkOwnership } = await import('../middleware/rbac.middleware.js');
  
  try {
    // Check if user has permission
    checkPermission(req.user, PERMISSIONS.USER_UPDATE_ANY);
    
    // Check if user owns the resource
    const resourceOwnerId = 123; // From database
    checkOwnership(req.user.id, resourceOwnerId);
    
    // Perform operation
    res.json({ success: true });
  } catch (error) {
    // Error will be caught by asyncHandler or error middleware
    throw error;
  }
});

export default router;
