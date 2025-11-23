import { Router } from 'express';
import {
  registerAgent,
  loginAgent,
  getCurrentAgent,
  updateAgentProfile,
  setupProfile,
  logoutAgent,
  updateLocation,
  updateAvailability,
  addSpecialization,
  removeSpecialization,
  getAllAgents,
  getAgentById,
  sendPhoneOTP,
  verifyPhone,
  resendVerificationEmail,
  verifyEmail
} from '../controllers/agent.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import { upload } from '../utils/uploadImage.js';

const router = Router();

// Public routes
router.route('/register').post(upload.single('profilePicture'), registerAgent);
router.route('/login').post(loginAgent);
router.route('/get-agents').get(getAllAgents); // Get all agents with filters
router.route('/get-agent/:id').get(getAgentById); // Get specific agent by ID
router.route('/verify-email').get(verifyEmail).post(verifyEmail); // Public email verification endpoint
router.route('/resend-verification').post(resendVerificationEmail); // Public resend verification endpoint
router.route('/send-phone-otp').post(sendPhoneOTP); // Public send phone OTP endpoint
router.route('/verify-phone').post(verifyPhone); // Public verify phone endpoint

// Protected routes - require authentication (Admin or Agent only)
router.route('/me').get(authenticateToken, requireRole('admin', 'agent'), getCurrentAgent);
router.route('/location').post(authenticateToken, requireRole('admin', 'agent'), upload.single('profilePicture'), updateAgentProfile);
router.route('/logout').post(authenticateToken, requireRole('admin', 'agent'), logoutAgent);

// Setup profile: accepts profilePicture (single) and documents (multiple)
router.route('/setup-profile').post(
  authenticateToken,
  requireRole('agent'),
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'documents', maxCount: 10 }
  ]),
  setupProfile
);

// Location and availability management (Admin or Agent only)
router.route('/update-location').post(authenticateToken, requireRole('admin', 'agent'), updateLocation);
router.route('/update-availability').post(authenticateToken, requireRole('admin', 'agent'), updateAvailability);

// Specialization management (Admin or Agent only)
router.route('/specializations').post(authenticateToken, requireRole('admin', 'agent'), addSpecialization);
router.route('/specializations/:category').delete(authenticateToken, requireRole('admin', 'agent'), removeSpecialization);

export default router;
