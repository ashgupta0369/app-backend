import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
    createAddress,
    getUserAddresses,
    getAddressById,
    getDefaultAddress,
    updateAddress,
    setDefaultAddress,
    deleteAddress,
    searchAddressesByLocation,
    getAddressesSummary
} from '../controllers/address.controller.js';

const router = Router();

// All address routes require authentication
router.use(authenticateToken);

// Address CRUD operations
router.post('/create-address', createAddress);
router.get('/get-addresses', getUserAddresses);
router.get('/summary', getAddressesSummary);
router.get('/search/location', searchAddressesByLocation);
// Split optional param route into two explicit routes to avoid path-to-regexp optional token issue
router.get('/default', getDefaultAddress);          // No type provided
router.get('/default/:type', getDefaultAddress);    // With specific type
router.get('/get-address/:id', getAddressById);
// Using POST for update per user request
router.post('/update-address/:id', updateAddress);
router.patch('/:id/default', setDefaultAddress);
router.post('/delete-address/:id', deleteAddress);

export default router;