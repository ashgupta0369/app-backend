import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken, extractTokenFromHeader } from '../utils/jwtUtils.js';
import User from '../models/user.model.js';
import Agent from '../models/agent.model.js';
import { HTTP_STATUS } from '../constants.js';
import tokenBlacklist from '../utils/tokenBlacklist.js';

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticateToken = asyncHandler(async (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    const authHeader = req.header('Authorization');
    const cookieToken = req.cookies?.token;
    
    let token;
    
    if (authHeader) {
      token = extractTokenFromHeader(authHeader);
    } else if (cookieToken) {
      token = cookieToken;
    } else {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Access token is required');
    }

    // Check if token is blacklisted (logged out)
    if (tokenBlacklist.isTokenBlacklisted(token)) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Token has been invalidated. Please login again.');
    }

    // Verify token
    const decodedToken = verifyToken(token);

    let user = null;
    let role = decodedToken.role || 'customer';

    // Try to find user based on role in token
    if (role === 'agent') {
      user = await Agent.findByPk(decodedToken.id);
      
      if (user) {
        // Check if agent is still active
        if (!user.isActiveAgent()) {
          throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Account has been deactivated');
        }
        
        // Attach agent info to request object
        req.user = {
          id: user.agentId,
          email: user.email,
          name: user.name,
          role: 'agent',
          isVerified: user.verificationStatus === 'verified',
          isActive: user.isActive
        };
      }
    } else {
      // Find in User table
      user = await User.findByPk(decodedToken.id);
      
      if (user) {
        // Check if user is still active
        if (!user.isActiveUser()) {
          throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Account has been deactivated');
        }
        
        // Attach user info to request object
        req.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive
        };
      }
    }
    
    if (!user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid access token - user not found');
    }
    
    req.token = token; // Store token for potential blacklisting
    
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, error?.message || 'Invalid access token');
  }
});

/**
 * Middleware to check specific roles (Legacy - kept for backward compatibility)
 * Note: For new routes, prefer using RBAC middleware with permissions
 * @deprecated Use requirePermission from rbac.middleware.js instead
 */
export const requireRole = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Insufficient permissions');
    }

    next();
  });
};

/**
 * Middleware to check if user is verified
 */
export const requireVerified = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
  }

  if (req.user.isVerified !== '1') {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Email verification required');
  }

  next();
});

// Export all middleware for easy access
export default {
  authenticateToken,
  requireRole,
  requireVerified
};