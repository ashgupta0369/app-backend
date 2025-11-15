import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  verifyEmail,
  resendOTP,
  refreshToken
} from '../controllers/user.controller.js';
import { authenticateToken, requireVerified } from '../middleware/auth.middleware.js';
import { 
  requirePermission, 
  attachUserPermissions 
} from '../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = Router();

// Public routes
router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/verify-email').post(verifyEmail);
router.route('/resend-otp').post(resendOTP);
router.route('/refresh-token').post(refreshToken);

// Protected routes - basic authentication
router.route('/me').get(authenticateToken, getCurrentUser);
router.route('/logout').post(authenticateToken, logoutUser);

// Get current user with their permissions (useful for frontend)
router.route('/me/permissions')
  .get(authenticateToken, attachUserPermissions, (req, res) => {
    res.json({
      user: req.user,
      permissions: req.userPermissions
    });
  });

// Routes that require verified email
// router.route('/some-protected-route').get(authenticateToken, requireVerified, someController);

// Example: Admin-only route to get all users (if you implement this controller)
// router.route('/all')
//   .get(authenticateToken, requirePermission(PERMISSIONS.USER_READ_ALL), getAllUsers);

export default router;