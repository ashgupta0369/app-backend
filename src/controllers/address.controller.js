import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {
    sendCreated,
    sendSuccess,
    sendBadRequest,
    sendNotFound
} from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants.js';
import Address from '../models/address.model.js';

// @desc    Create a new address
// @route   POST /api/addresses
// @access  Private
const createAddress = asyncHandler(async (req, res) => {
    const {
        addressType,
        isDefault,
        addressFor,
        fullName,
        phone,
        addressLine1,
        addressLine2,
        landmark,
        city,
        state,
        postalCode,
        country,
        latitude,
        longitude,
        instructions
    } = req.body;

    // Validate required fields
    if (!fullName || !addressLine1 || !city || !state || !postalCode) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Full name, address line 1, city, state, and postal code are required'
        );
    }

    // Create address
    const newAddress = await Address.create({
        userId: req.user.id,
        addressType: addressType || 'home',
        isDefault: isDefault || '0',
        addressFor: addressFor || 'self',
        fullName,
        phone,
        addressLine1,
        addressLine2,
        landmark,
        city,
        state,
        postalCode,
        country: country || 'India',
        latitude,
        longitude,
        instructions,
        createdBy: req.user.id,
        createdOn: new Date(), // explicitly set (also enforced in model hook)
        isActive: '1'
    });
    // If this address is marked as default, unset default on all other addresses of the user
    if (newAddress.isDefault === '1') {
        const { Op } = await import('sequelize');
        await Address.update(
            { isDefault: '0' },
            {
                where: {
                    userId: req.user.id,
                    addressId: { [Op.ne]: newAddress.addressId }
                }
            }
        );
    }
    return sendCreated(
        res,
        'Address created successfully',
        newAddress
    );
});

// @desc    Get all addresses for logged-in user
// @route   GET /api/addresses
// @access  Private
const getUserAddresses = asyncHandler(async (req, res) => {
    const { 
        addressType, 
        addressFor,
        isActive,
        page = 1, 
        limit = 20 
    } = req.query;

    // Build options for filtering
    const options = {};
    if (isActive !== undefined) {
        options.isActive = isActive === 'true';
    }
    if (addressType) {
        options.addressType = addressType;
    }
    if (addressFor) {
        options.addressFor = addressFor;
    }

    // Get addresses with pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const addresses = await Address.findByUser(req.user.id, options);
    const paginatedAddresses = addresses.slice(offset, offset + parseInt(limit));
    
    const totalCount = addresses.length;
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    return sendSuccess(
        res,
        'Addresses retrieved successfully',
        {
            addresses: paginatedAddresses,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalAddresses: totalCount,
                limit: parseInt(limit)
            }
        }
    );
});

// @desc    Get address by ID
// @route   GET /api/addresses/:id
// @access  Private
const getAddressById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const address = await Address.findOne({
        where: {
            addressId: id,
            userId: req.user.id // Ensure user can only access their own addresses
        }
    });

    if (!address) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            'Address not found'
        );
    }

    return sendSuccess(
        res,
        'Address retrieved successfully',
        address
    );
});

// @desc    Get default address
// @route   GET /api/addresses/default/:type?
// @access  Private
const getDefaultAddress = asyncHandler(async (req, res) => {
    const { type } = req.params;

    const address = await Address.findDefaultAddress(req.user.id, type);

    if (!address) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            `No default ${type || ''} address found`
        );
    }

    return sendSuccess(
        res,
        'Default address retrieved successfully',
        address
    );
});

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
const updateAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        addressType,
        isDefault,
        addressFor,
        fullName,
        phone,
        addressLine1,
        addressLine2,
        landmark,
        city,
        state,
        postalCode,
        country,
        latitude,
        longitude,
        instructions,
        isActive
    } = req.body;

    const address = await Address.findOne({
        where: {
            addressId: id,
            userId: req.user.id
        }
    });
    
    if (!address) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            'Address not found'
        );
    }

    // Update address
    await address.update({
        ...(addressType && { addressType }),
        ...(isDefault !== undefined && { isDefault }),
        ...(addressFor && { addressFor }),
        ...(fullName && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(addressLine1 && { addressLine1 }),
        ...(addressLine2 !== undefined && { addressLine2 }),
        ...(landmark !== undefined && { landmark }),
        ...(city && { city }),
        ...(state && { state }),
        ...(postalCode && { postalCode }),
        ...(country && { country }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(instructions !== undefined && { instructions }),
        ...(isActive && { isActive }),
        updatedBy: req.user.id
    });
    if (isDefault === '1') {
        const { Op } = await import('sequelize');
        await Address.update(
            { isDefault: '0' },
            {
                where: {
                    userId: req.user.id,
                    addressId: { [Op.ne]: address.addressId }
                }
            }
        );
    }
    return sendSuccess(
        res,
        'Address updated successfully',
        address
    );
});

// @desc    Set address as default
// @route   PATCH /api/addresses/:id/default
// @access  Private
const setDefaultAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const address = await Address.findOne({
        where: {
            addressId: id,
            userId: req.user.id,
            isActive: '1'
        }
    });

    if (!address) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            'Active address not found'
        );
    }

    await address.setAsDefault();

    return sendSuccess(
        res,
        'Address set as default successfully',
        address
    );
});

// @desc    Delete address (soft delete)
// @route   DELETE /api/addresses/:id
// @access  Private
const deleteAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { permanent } = req.query;
    console.log('permanent', permanent);
    const address = await Address.findOne({
        where: {
            addressId: id,
            userId: req.user.id
        }
    });

    if (!address) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            'Address not found'
        );
    }

    if (permanent === 'true') {
        // Hard delete
        await address.destroy();
    } else {
        // Soft delete
        await address.update({ 
            isActive: '0',
            isDefault: '0', // Remove default status when deactivating
            updatedBy: req.user.id 
        });
    }

    return sendSuccess(
        res,
        'Address deleted successfully',
        null
    );
});

// @desc    Search addresses by location
// @route   GET /api/addresses/search/location
// @access  Private
const searchAddressesByLocation = asyncHandler(async (req, res) => {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Latitude and longitude are required'
        );
    }

    const addresses = await Address.findByLocation(
        parseFloat(latitude),
        parseFloat(longitude),
        parseInt(radius)
    );

    // Filter to only show current user's addresses
    const userAddresses = addresses.filter(addr => addr.userId === req.user.id);

    return sendSuccess(
        res,
        'Addresses found by location',
        userAddresses
    );
});

// @desc    Get address types summary
// @route   GET /api/addresses/summary
// @access  Private
const getAddressesSummary = asyncHandler(async (req, res) => {
    const addresses = await Address.findByUser(req.user.id, { isActive: true });

    const summary = {
        total: addresses.length,
        byType: {},
        byAddressFor: {},
        defaultAddresses: addresses.filter(addr => addr.isDefault === '1').length
    };

    // Group by address type
    addresses.forEach(addr => {
        summary.byType[addr.addressType] = (summary.byType[addr.addressType] || 0) + 1;
        summary.byAddressFor[addr.addressFor] = (summary.byAddressFor[addr.addressFor] || 0) + 1;
    });

    return sendSuccess(
        res,
        'Address summary retrieved successfully',
        summary
    );
});

export {
    createAddress,
    getUserAddresses,
    getAddressById,
    getDefaultAddress,
    updateAddress,
    setDefaultAddress,
    deleteAddress,
    searchAddressesByLocation,
    getAddressesSummary
};