/**
 * RBAC (Role-Based Access Control) Configuration
 * 
 * This file defines:
 * 1. All available permissions in the system
 * 2. Permission mappings for each role
 * 3. Helper functions to check permissions
 */

// ========================================
// PERMISSION DEFINITIONS
// ========================================

export const PERMISSIONS = {
  // User Management Permissions
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_READ_ALL: 'user:read:all',
  USER_UPDATE: 'user:update',
  USER_UPDATE_ANY: 'user:update:any',
  USER_DELETE: 'user:delete',
  USER_DELETE_ANY: 'user:delete:any',
  USER_VERIFY: 'user:verify',
  USER_ACTIVATE: 'user:activate',
  USER_DEACTIVATE: 'user:deactivate',
  
  // Agent Management Permissions
  AGENT_CREATE: 'agent:create',
  AGENT_READ: 'agent:read',
  AGENT_READ_ALL: 'agent:read:all',
  AGENT_UPDATE: 'agent:update',
  AGENT_UPDATE_ANY: 'agent:update:any',
  AGENT_DELETE: 'agent:delete',
  AGENT_DELETE_ANY: 'agent:delete:any',
  AGENT_VERIFY: 'agent:verify',
  AGENT_APPROVE: 'agent:approve',
  AGENT_REJECT: 'agent:reject',
  AGENT_ACTIVATE: 'agent:activate',
  AGENT_DEACTIVATE: 'agent:deactivate',
  
  // Category Management Permissions
  CATEGORY_CREATE: 'category:create',
  CATEGORY_READ: 'category:read',
  CATEGORY_UPDATE: 'category:update',
  CATEGORY_DELETE: 'category:delete',
  CATEGORY_ACTIVATE: 'category:activate',
  CATEGORY_DEACTIVATE: 'category:deactivate',
  
  // Address Management Permissions
  ADDRESS_CREATE: 'address:create',
  ADDRESS_READ: 'address:read',
  ADDRESS_READ_ALL: 'address:read:all',
  ADDRESS_UPDATE: 'address:update',
  ADDRESS_UPDATE_ANY: 'address:update:any',
  ADDRESS_DELETE: 'address:delete',
  ADDRESS_DELETE_ANY: 'address:delete:any',
  
  // Booking/Order Management Permissions (for future implementation)
  BOOKING_CREATE: 'booking:create',
  BOOKING_READ: 'booking:read',
  BOOKING_READ_ALL: 'booking:read:all',
  BOOKING_UPDATE: 'booking:update',
  BOOKING_UPDATE_ANY: 'booking:update:any',
  BOOKING_DELETE: 'booking:delete',
  BOOKING_DELETE_ANY: 'booking:delete:any',
  BOOKING_ASSIGN: 'booking:assign',
  BOOKING_COMPLETE: 'booking:complete',
  BOOKING_CANCEL: 'booking:cancel',
  
  // Analytics & Reporting Permissions
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // System Configuration Permissions
  SYSTEM_CONFIG_READ: 'system:config:read',
  SYSTEM_CONFIG_UPDATE: 'system:config:update',
  
  // File Upload Permissions
  FILE_UPLOAD: 'file:upload',
  FILE_DELETE: 'file:delete',
  FILE_DELETE_ANY: 'file:delete:any'
};

// ========================================
// ROLE-PERMISSION MAPPINGS
// ========================================

export const ROLE_PERMISSIONS = {
  // ADMIN - Full system access
  admin: [
    // User Management
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_READ_ALL,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_UPDATE_ANY,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_DELETE_ANY,
    PERMISSIONS.USER_VERIFY,
    PERMISSIONS.USER_ACTIVATE,
    PERMISSIONS.USER_DEACTIVATE,
    
    // Agent Management
    PERMISSIONS.AGENT_CREATE,
    PERMISSIONS.AGENT_READ,
    PERMISSIONS.AGENT_READ_ALL,
    PERMISSIONS.AGENT_UPDATE,
    PERMISSIONS.AGENT_UPDATE_ANY,
    PERMISSIONS.AGENT_DELETE,
    PERMISSIONS.AGENT_DELETE_ANY,
    PERMISSIONS.AGENT_VERIFY,
    PERMISSIONS.AGENT_APPROVE,
    PERMISSIONS.AGENT_REJECT,
    PERMISSIONS.AGENT_ACTIVATE,
    PERMISSIONS.AGENT_DEACTIVATE,
    
    // Category Management
    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.CATEGORY_UPDATE,
    PERMISSIONS.CATEGORY_DELETE,
    PERMISSIONS.CATEGORY_ACTIVATE,
    PERMISSIONS.CATEGORY_DEACTIVATE,
    
    // Address Management
    PERMISSIONS.ADDRESS_CREATE,
    PERMISSIONS.ADDRESS_READ,
    PERMISSIONS.ADDRESS_READ_ALL,
    PERMISSIONS.ADDRESS_UPDATE,
    PERMISSIONS.ADDRESS_UPDATE_ANY,
    PERMISSIONS.ADDRESS_DELETE,
    PERMISSIONS.ADDRESS_DELETE_ANY,
    
    // Booking Management
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_READ,
    PERMISSIONS.BOOKING_READ_ALL,
    PERMISSIONS.BOOKING_UPDATE,
    PERMISSIONS.BOOKING_UPDATE_ANY,
    PERMISSIONS.BOOKING_DELETE,
    PERMISSIONS.BOOKING_DELETE_ANY,
    PERMISSIONS.BOOKING_ASSIGN,
    PERMISSIONS.BOOKING_COMPLETE,
    PERMISSIONS.BOOKING_CANCEL,
    
    // Analytics & Reporting
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    
    // System Configuration
    PERMISSIONS.SYSTEM_CONFIG_READ,
    PERMISSIONS.SYSTEM_CONFIG_UPDATE,
    
    // File Management
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DELETE,
    PERMISSIONS.FILE_DELETE_ANY
  ],
  
  // AGENT - Service provider access
  agent: [
    // Own Profile Management
    PERMISSIONS.AGENT_READ,
    PERMISSIONS.AGENT_UPDATE,
    
    // Category Access
    PERMISSIONS.CATEGORY_READ,
    
    // Own Bookings
    PERMISSIONS.BOOKING_READ,
    PERMISSIONS.BOOKING_UPDATE,
    PERMISSIONS.BOOKING_COMPLETE,
    
    // File Upload (for profile pictures, work images)
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DELETE,
    
    // User Read (to view customer details for bookings)
    PERMISSIONS.USER_READ
  ],
  
  // CUSTOMER - End user access
  customer: [
    // Own Profile Management
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    
    // Address Management
    PERMISSIONS.ADDRESS_CREATE,
    PERMISSIONS.ADDRESS_READ,
    PERMISSIONS.ADDRESS_UPDATE,
    PERMISSIONS.ADDRESS_DELETE,
    
    // Category Access
    PERMISSIONS.CATEGORY_READ,
    
    // Agent Discovery
    PERMISSIONS.AGENT_READ,
    PERMISSIONS.AGENT_READ_ALL,
    
    // Booking Management
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_READ,
    PERMISSIONS.BOOKING_UPDATE,
    PERMISSIONS.BOOKING_CANCEL,
    
    // File Upload
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DELETE
  ]
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  if (!role || !permission) {
    return false;
  }
  
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
};

/**
 * Check if a role has all of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAllPermissions = (role, permissions) => {
  if (!role || !Array.isArray(permissions)) {
    return false;
  }
  
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Check if a role has any of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAnyPermission = (role, permissions) => {
  if (!role || !Array.isArray(permissions)) {
    return false;
  }
  
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Get all permissions for a specific role
 * @param {string} role - User role
 * @returns {string[]} - Array of permissions
 */
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if user owns the resource
 * @param {number|string} userId - ID of the authenticated user
 * @param {number|string} resourceOwnerId - ID of the resource owner
 * @returns {boolean}
 */
export const isResourceOwner = (userId, resourceOwnerId) => {
  return userId && resourceOwnerId && String(userId) === String(resourceOwnerId);
};

/**
 * Check if user can perform action on resource
 * Combines permission check with ownership check
 * @param {Object} params
 * @param {string} params.role - User role
 * @param {string} params.permission - Required permission
 * @param {string} params.ownerPermission - Permission required for own resources
 * @param {number|string} params.userId - Current user ID
 * @param {number|string} params.resourceOwnerId - Resource owner ID
 * @returns {boolean}
 */
export const canPerformAction = ({ role, permission, ownerPermission, userId, resourceOwnerId }) => {
  // Check if user has permission for any resource
  if (hasPermission(role, permission)) {
    return true;
  }
  
  // If owner permission is provided, check if user owns resource and has owner permission
  if (ownerPermission && isResourceOwner(userId, resourceOwnerId)) {
    return hasPermission(role, ownerPermission);
  }
  
  return false;
};

export default {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getRolePermissions,
  isResourceOwner,
  canPerformAction
};
