/**
 * RBAC (Role-Based Access Control) Middleware
 * 
 * Provides middleware functions to protect routes based on permissions
 */

import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants.js';
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  isResourceOwner,
  canPerformAction
} from '../config/permissions.js';

/**
 * Middleware to check if user has a specific permission
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware
 * 
 * @example
 * router.post('/users', authenticateToken, requirePermission(PERMISSIONS.USER_CREATE), createUser);
 */
export const requirePermission = (permission) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Authentication required'
      );
    }

    const userRole = req.user.role;
    
    if (!hasPermission(userRole, permission)) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        `Insufficient permissions. Required permission: ${permission}`
      );
    }

    next();
  });
};

/**
 * Middleware to check if user has ALL specified permissions
 * @param {...string} permissions - Required permissions
 * @returns {Function} Express middleware
 * 
 * @example
 * router.put('/users/:id/role', authenticateToken, requireAllPermissions(PERMISSIONS.USER_UPDATE_ANY, PERMISSIONS.USER_ACTIVATE), updateUserRole);
 */
export const requireAllPermissions = (...permissions) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Authentication required'
      );
    }

    const userRole = req.user.role;
    
    if (!hasAllPermissions(userRole, permissions)) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        `Insufficient permissions. Required all of: ${permissions.join(', ')}`
      );
    }

    next();
  });
};

/**
 * Middleware to check if user has ANY of the specified permissions
 * @param {...string} permissions - Required permissions (user needs at least one)
 * @returns {Function} Express middleware
 * 
 * @example
 * router.get('/bookings/:id', authenticateToken, requireAnyPermission(PERMISSIONS.BOOKING_READ, PERMISSIONS.BOOKING_READ_ALL), getBooking);
 */
export const requireAnyPermission = (...permissions) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Authentication required'
      );
    }

    const userRole = req.user.role;
    
    if (!hasAnyPermission(userRole, permissions)) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        `Insufficient permissions. Required any of: ${permissions.join(', ')}`
      );
    }

    next();
  });
};

/**
 * Middleware to check if user can access their own resource OR has permission for any resource
 * @param {string} ownerPermission - Permission required to access own resource
 * @param {string} anyPermission - Permission required to access any resource
 * @param {Function} getResourceOwnerId - Function to extract resource owner ID from request
 * @returns {Function} Express middleware
 * 
 * @example
 * // User can update their own profile OR admin can update any profile
 * router.put('/users/:id', 
 *   authenticateToken, 
 *   requireOwnershipOrPermission(
 *     PERMISSIONS.USER_UPDATE,
 *     PERMISSIONS.USER_UPDATE_ANY,
 *     (req) => req.params.id
 *   ),
 *   updateUser
 * );
 */
export const requireOwnershipOrPermission = (ownerPermission, anyPermission, getResourceOwnerId) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Authentication required'
      );
    }

    const userRole = req.user.role;
    const userId = req.user.id;
    
    // Get resource owner ID using the provided function
    const resourceOwnerId = getResourceOwnerId(req);
    
    // Check if user can perform action
    const canAccess = canPerformAction({
      role: userRole,
      permission: anyPermission,
      ownerPermission: ownerPermission,
      userId: userId,
      resourceOwnerId: resourceOwnerId
    });
    
    if (!canAccess) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You do not have permission to access this resource'
      );
    }

    next();
  });
};

/**
 * Middleware to check if user owns the resource
 * Useful for ensuring users can only access their own data
 * @param {Function} getResourceOwnerId - Function to extract resource owner ID from request
 * @returns {Function} Express middleware
 * 
 * @example
 * router.delete('/addresses/:id',
 *   authenticateToken,
 *   requireOwnership((req) => req.address.userId), // Assumes address is loaded in middleware
 *   deleteAddress
 * );
 */
export const requireOwnership = (getResourceOwnerId) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Authentication required'
      );
    }

    const userId = req.user.id;
    const resourceOwnerId = getResourceOwnerId(req);
    
    if (!isResourceOwner(userId, resourceOwnerId)) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You do not have permission to access this resource'
      );
    }

    next();
  });
};

/**
 * Middleware to check if user is admin
 * Shortcut for checking admin role
 * @returns {Function} Express middleware
 * 
 * @example
 * router.delete('/users/:id', authenticateToken, requireAdmin, deleteUser);
 */
export const requireAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      'Authentication required'
    );
  }

  if (req.user.role !== 'admin') {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Admin access required'
    );
  }

  next();
});

/**
 * Middleware factory to check if user has specific role
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 * 
 * @example
 * router.get('/agent/dashboard', authenticateToken, requireRole('admin', 'agent'), getAgentDashboard);
 */
export const requireRole = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Authentication required'
      );
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        `Access restricted to: ${roles.join(', ')}`
      );
    }

    next();
  });
};

/**
 * Middleware to attach user permissions to request object
 * Useful for conditional rendering in responses
 * @returns {Function} Express middleware
 * 
 * @example
 * router.get('/me', authenticateToken, attachUserPermissions, getCurrentUser);
 * // Then in controller: res.json({ user: userData, permissions: req.userPermissions })
 */
export const attachUserPermissions = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      'Authentication required'
    );
  }

  const { getRolePermissions } = await import('../config/permissions.js');
  req.userPermissions = getRolePermissions(req.user.role);
  
  next();
});

/**
 * Helper function to check permission programmatically in controllers
 * @param {Object} user - User object from request
 * @param {string} permission - Permission to check
 * @throws {ApiError} If user doesn't have permission
 * 
 * @example
 * // In a controller
 * checkPermission(req.user, PERMISSIONS.USER_DELETE_ANY);
 */
export const checkPermission = (user, permission) => {
  if (!user) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      'Authentication required'
    );
  }

  if (!hasPermission(user.role, permission)) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      `Insufficient permissions. Required: ${permission}`
    );
  }
};

/**
 * Helper function to check ownership programmatically in controllers
 * @param {number|string} userId - Current user ID
 * @param {number|string} resourceOwnerId - Resource owner ID
 * @throws {ApiError} If user doesn't own the resource
 * 
 * @example
 * // In a controller
 * checkOwnership(req.user.id, address.userId);
 */
export const checkOwnership = (userId, resourceOwnerId) => {
  if (!isResourceOwner(userId, resourceOwnerId)) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'You do not have permission to access this resource'
    );
  }
};

export default {
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireOwnershipOrPermission,
  requireOwnership,
  requireAdmin,
  requireRole,
  attachUserPermissions,
  checkPermission,
  checkOwnership
};
