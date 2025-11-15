import { Router } from 'express';
import {
  registerAgent,
  loginAgent,
  getCurrentAgent,
  updateAgentProfile,
  logoutAgent,
  updateLocation,
  updateAvailability,
  addSpecialization,
  removeSpecialization,
  getAllAgents,
  getAgentById
} from '../controllers/agent.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import { upload } from '../utils/uploadImage.js';

const router = Router();

// Public routes
router.route('/register').post(upload.single('profilePicture'), registerAgent);
router.route('/login').post(loginAgent);
router.route('/get-agents').get(getAllAgents); // Get all agents with filters
router.route('/get-agent/:id').get(getAgentById); // Get specific agent by ID

// Protected routes - require authentication (Admin or Agent only)
router.route('/me').get(authenticateToken, requireRole('admin', 'agent'), getCurrentAgent);
router.route('/update').post(authenticateToken, requireRole('admin', 'agent'), upload.single('profilePicture'), updateAgentProfile);
router.route('/logout').post(authenticateToken, requireRole('admin', 'agent'), logoutAgent);

// Location and availability management (Admin or Agent only)
router.route('/location').post(authenticateToken, requireRole('admin', 'agent'), updateLocation);
router.route('/availability').post(authenticateToken, requireRole('admin', 'agent'), updateAvailability);

// Specialization management (Admin or Agent only)
router.route('/specializations').post(authenticateToken, requireRole('admin', 'agent'), addSpecialization);
router.route('/specializations/:category').delete(authenticateToken, requireRole('admin', 'agent'), removeSpecialization);

export default router;
