import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { uploadSingle } from '../utils/uploadImage.js';
import {
    createCategory,
    getAllCategories,
    getCategoryById,
    getCategoryBySlug,
    updateCategory,
    deleteCategory,
    getCategoryTree,
    suspendCategory,
    activateCategory
} from '../controllers/category.controller.js';

const router = Router();

// Optional upload middleware - doesn't throw error if no image is provided
const optionalImageUpload = (req, res, next) => {
    // Check if request has multipart form data
    console.log('req.file', req.file)
    if (req.is('multipart/form-data')) {
        // Use upload middleware if multipart data is detected
        return uploadSingle('categoryImage', 'category')(req, res, (err) => {
            if (err) {
                // Pass upload errors to error handler
                return next(err);
            }
            next();
        });
    }
    // Skip upload if not multipart form data
    next();
};

// Public routes
router.get('/get-all-category', getAllCategories);
router.get('/tree', getCategoryTree);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategoryById);

// Protected routes (require authentication)
router.post('/create', authenticateToken, optionalImageUpload, createCategory);
router.post('/update/:id', authenticateToken, optionalImageUpload, updateCategory);
router.post('/delete/:id', authenticateToken, deleteCategory);
router.post('/suspend/:id', authenticateToken, suspendCategory);
router.post('/activate/:id', authenticateToken, activateCategory);

export default router;