import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {
    sendCreated,
    sendSuccess,
    sendBadRequest,
    sendNotFound
} from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants.js';
import Category from '../models/category.model.js';
import { sequelize } from '../db/index.js';
import { Sequelize } from 'sequelize';
import { getImageUrl, getImageUrlWithBaseUrl, deleteImage } from '../utils/uploadImage.js';
import path from 'path';

// Helper function to add full image URLs to category data
const addImageUrls = (category, req) => {
    if (!category) return category;
    
    const categoryData = category.toJSON ? category.toJSON() : category;
    
    if (categoryData.imageUrl) {
        categoryData.imageUrlFull = getImageUrl(categoryData.imageUrl, req);
    }
    
    // Handle parent category
    if (categoryData.parent && categoryData.parent.imageUrl) {
        categoryData.parent.imageUrlFull = getImageUrl(categoryData.parent.imageUrl, req);
    }
    
    // Handle children categories
    if (categoryData.children && Array.isArray(categoryData.children)) {
        categoryData.children = categoryData.children.map(child => {
            if (child.imageUrl) {
                child.imageUrlFull = getImageUrl(child.imageUrl, req);
            }
            return child;
        });
    }
    
    return categoryData;
};

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private (Admin/Agent)
const createCategory = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        slug,
        parentId,
        imageUrl,
        sortOrder
    } = req.body;
    console.log('req.body', req.body);
    // Validate required fields
    if (!name) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Category name is required'
        );
    }

    // Check if category name already exists
    const existingCategory = await Category.findByName(name);
    if (existingCategory) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Category with this name already exists'
        );
    }

    // Check if custom slug already exists
    if (slug) {
        const existingSlug = await Category.findBySlug(slug);
        if (existingSlug) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                'Category with this slug already exists'
            );
        }
    }

    // Validate parent category if provided
    if (parentId) {
        const parentCategory = await Category.findByPk(parentId);
        if (!parentCategory) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                'Parent category not found'
            );
        }
    }

    // Handle image upload - Save only folder path to database
    let finalImagePath = null; // Store path, not full URL
    
    // Check if image was processed by upload middleware
    if (req.uploadedImage) {
        console.log('✅ Image processed successfully');
        // Store only the path in database
        finalImagePath = req.uploadedImage.path;
    } else if (imageUrl && imageUrl.trim() !== '') {
        // Fallback: Use provided URL if no upload but URL is given
        console.log('📎 Using provided image URL');
        finalImagePath = imageUrl; // In case of external URL
    } else {
        console.log('📷 No image provided - category will be created without image');
        finalImagePath = null;
    }
    console.log('finalImagePath', finalImagePath);
    // Create category
    const newCategory = await Category.create({
        name,
        description,
        slug,
        parentId: parentId || null,
        imageUrl: finalImagePath, // Store path, not full URL
        sortOrder: sortOrder || 0,
        createdBy: req.user.id,
        createdOn: new Date(),
        isActive: '1'
    });

    // Fetch created category with parent info
    const categoryWithParent = await Category.findByPk(newCategory.id, {
        include: [
            {
                model: Category,
                as: 'parent',
                attributes: ['id', 'name', 'slug']
            }
        ]
    });

    // Convert to JSON and add full image URL for response
    const responseData = categoryWithParent.toJSON();
    if (responseData.imageUrl) {
        responseData.imageUrlFull = getImageUrl(responseData.imageUrl, req);
    }

    return sendCreated(
        res,
        'Category created successfully',
        responseData
    );
});// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
// @query   active (boolean) - Filter by active status
// @query   parentId (number|null) - Filter by parent category
// @query   includeChildren (boolean) - Include children in response
// @query   parentOnly (boolean) - Show only categories that have children
// @query   page (number) - Page number for pagination
// @query   limit (number) - Number of items per page
const getAllCategories = asyncHandler(async (req, res) => {
    const { 
        active, 
        parentId, 
        includeChildren,
        parentOnly,
        page = 1, 
        limit = 50 
    } = req.query;

    // Build where clause
    const whereClause = {};
    
    if (active !== undefined) {
        whereClause.isActive = active === 'true' ? '1' : '0';
    }
    
    if (parentId !== undefined) {
        whereClause.parentId = parentId === 'null' ? null : parseInt(parentId);
    }

    // Setup include for parent and optionally children
    const include = [
        {
            model: Category,
            as: 'parent',
            attributes: ['id', 'name', 'slug']
        }
    ];

    if (includeChildren === 'true') {
        include.push({
            model: Category,
            as: 'children',
            attributes: ['id', 'name', 'slug', 'isActive', 'sortOrder']
        });
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let queryOptions = {
        where: whereClause,
        include,
        order: [['sortOrder', 'ASC'], ['name', 'ASC']],
        limit: parseInt(limit),
        offset
    };

    // If parentOnly is true, we need to filter categories that have children
    if (parentOnly === 'true') {
        // Use a subquery to find categories that have children
        queryOptions.where = {
            ...whereClause,
            id: {
                [Sequelize.Op.in]: sequelize.literal(`(
                    SELECT DISTINCT parent_id 
                    FROM category 
                    WHERE parent_id IS NOT NULL
                )`)
            }
        };
    }

    const { count, rows: categories } = await Category.findAndCountAll(queryOptions);

    // Add full image URLs to all categories
    const categoriesWithImageUrls = categories.map(category => addImageUrls(category, req));

    const totalPages = Math.ceil(count / parseInt(limit));

    return sendSuccess(
        res,
        'Categories retrieved successfully',
        {
            categories: categoriesWithImageUrls,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCategories: count,
                limit: parseInt(limit)
            }
        }
    );
});

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { includeChildren } = req.query;

    const include = [
        {
            model: Category,
            as: 'parent',
            attributes: ['id', 'name', 'slug']
        }
    ];

    if (includeChildren === 'true') {
        include.push({
            model: Category,
            as: 'children',
            attributes: ['id', 'name', 'slug', 'isActive', 'sortOrder'],
            order: [['sortOrder', 'ASC'], ['name', 'ASC']]
        });
    }

    const category = await Category.findByPk(id, { include });

    if (!category) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            'Category not found'
        );
    }

    // Add full image URLs
    const categoryWithImageUrls = addImageUrls(category, req);

    return sendSuccess(
        res,
        'Category retrieved successfully',
        categoryWithImageUrls
    );
});

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
const getCategoryBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { includeChildren } = req.query;

    const include = [
        {
            model: Category,
            as: 'parent',
            attributes: ['id', 'name', 'slug']
        }
    ];

    if (includeChildren === 'true') {
        include.push({
            model: Category,
            as: 'children',
            attributes: ['id', 'name', 'slug', 'isActive', 'sortOrder'],
            order: [['sortOrder', 'ASC'], ['name', 'ASC']]
        });
    }

    const category = await Category.findBySlug(slug, { include });

    if (!category) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            'Category not found'
        );
    }

    // Add full image URLs
    const categoryWithImageUrls = addImageUrls(category, req);

    return sendSuccess(
        res,
        'Category retrieved successfully',
        categoryWithImageUrls
    );
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin/Agent)
const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        name,
        description,
        slug,
        parentId,
        imageUrl,
        sortOrder,
        isActive
    } = req.body;

    const category = await Category.findByPk(id);

    if (!category) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            'Category not found'
        );
    }

    // Check if new name conflicts with existing category
    if (name && name !== category.name) {
        const existingCategory = await Category.findByName(name);
        if (existingCategory && existingCategory.id !== parseInt(id)) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                'Category with this name already exists'
            );
        }
    }

    // Check if new slug conflicts with existing category
    if (slug && slug !== category.slug) {
        const existingSlug = await Category.findBySlug(slug);
        if (existingSlug && existingSlug.id !== parseInt(id)) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                'Category with this slug already exists'
            );
        }
    }

    // Validate parent category if provided
    if (parentId !== undefined) {
        if (parentId === parseInt(id)) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                'Category cannot be its own parent'
            );
        }

        if (parentId && parentId !== category.parentId) {
            const parentCategory = await Category.findByPk(parentId);
            if (!parentCategory) {
                throw new ApiError(
                    HTTP_STATUS.BAD_REQUEST,
                    'Parent category not found'
                );
            }
        }
    }

    // Handle image upload - Save only folder path to database
    let finalImagePath = category.imageUrl; // Keep existing value by default
    
    // Check if new image was processed by upload middleware
    if (req.uploadedImage) {
        console.log('✅ New image processed successfully');
        
        // Delete old image if exists
        if (category.imageUrl) {
            await deleteImage(category.imageUrl);
        }
        
        // Store only the path in database
        finalImagePath = req.uploadedImage.path;
    } else if (imageUrl !== undefined && imageUrl !== category.imageUrl) {
        // Image URL was explicitly changed in request body
        console.log('📎 Image URL updated');
        finalImagePath = imageUrl;
    }

    // Update category
    await category.update({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(slug && { slug }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(finalImagePath !== undefined && { imageUrl: finalImagePath }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive && { isActive }),
        updatedBy: req.user.id
    });

    // Fetch updated category with parent info
    const updatedCategory = await Category.findByPk(id, {
        include: [
            {
                model: Category,
                as: 'parent',
                attributes: ['id', 'name', 'slug']
            }
        ]
    });

    // Convert to JSON and add full image URL for response
    const responseData = updatedCategory.toJSON();
    if (responseData.imageUrl) {
        responseData.imageUrlFull = getImageUrl(responseData.imageUrl, req);
    }

    return sendSuccess(
        res,
        'Category updated successfully',
        responseData
    );
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin/Agent)
const deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;

    const category = await Category.findByPk(id);

    if (!category) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            'Category not found'
        );
    }

    // Check if category has children
    const hasChildren = await category.hasChildren();
    
    if (hasChildren && force !== 'true') {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Cannot delete category with children. Use force=true to delete anyway.'
        );
    }

    // If force delete, update children to have no parent
    if (hasChildren && force === 'true') {
        await Category.update(
            { parentId: null },
            { where: { parentId: id } }
        );
    }

    await category.destroy();

    return sendSuccess(
        res,
        'Category deleted successfully',
        null
    );
});

// @desc    Get category tree (hierarchical structure)
// @route   GET /api/categories/tree
// @access  Public
const getCategoryTree = asyncHandler(async (req, res) => {
    const { active } = req.query;

    const whereClause = {};
    if (active !== undefined) {
        whereClause.isActive = active === 'true' ? '1' : '0';
    }

    // Get all categories
    const allCategories = await Category.findAll({
        where: whereClause,
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });

    // Build tree structure with image URLs
    const buildTree = (categories, parentId = null) => {
        return categories
            .filter(cat => cat.parentId === parentId)
            .map(cat => {
                const categoryData = cat.toJSON();
                // Add full image URL for each category
                if (categoryData.imageUrl) {
                    categoryData.imageUrlFull = getImageUrl(categoryData.imageUrl, req);
                }
                return {
                    ...categoryData,
                    children: buildTree(categories, cat.id)
                };
            });
    };

    const categoryTree = buildTree(allCategories);

    return sendSuccess(
        res,
        'Category tree retrieved successfully',
        categoryTree
    );
});

// @desc    Suspend category (set isActive to '0')
// @route   POST /api/categories/suspend/:id
// @access  Private (Admin/Agent)
const suspendCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { suspendChildren = false } = req.body;

    const category = await Category.findByPk(id);

    if (!category) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            'Category not found'
        );
    }

    // Check if category is already suspended
    if (category.isActive === '0') {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Category is already suspended'
        );
    }

    // Suspend the category
    await category.update({
        isActive: '0',
        updatedBy: req.user.id,
        updatedOn: new Date()
    });

    // Optionally suspend all children categories
    if (suspendChildren) {
        await Category.update(
            { 
                isActive: '0',
                updatedBy: req.user.id,
                updatedOn: new Date()
            },
            { 
                where: { parentId: id }
            }
        );
    }

    // Fetch updated category with parent info
    const updatedCategory = await Category.findByPk(id, {
        include: [
            {
                model: Category,
                as: 'parent',
                attributes: ['id', 'name', 'slug', 'isActive']
            },
            {
                model: Category,
                as: 'children',
                attributes: ['id', 'name', 'slug', 'isActive']
            }
        ]
    });

    return sendSuccess(
        res,
        suspendChildren 
            ? 'Category and its children suspended successfully'
            : 'Category suspended successfully',
        updatedCategory
    );
});

// @desc    Activate category (set isActive to '1')
// @route   POST /api/categories/activate/:id
// @access  Private (Admin/Agent)
const activateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { activateChildren = false } = req.body;

    const category = await Category.findByPk(id);

    if (!category) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            'Category not found'
        );
    }

    // Check if category is already active
    if (category.isActive === '1') {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Category is already active'
        );
    }

    // Activate the category
    await category.update({
        isActive: '1',
        updatedBy: req.user.id,
        updatedOn: new Date()
    });

    // Optionally activate all children categories
    if (activateChildren) {
        await Category.update(
            { 
                isActive: '1',
                updatedBy: req.user.id,
                updatedOn: new Date()
            },
            { 
                where: { parentId: id }
            }
        );
    }

    // Fetch updated category with parent info
    const updatedCategory = await Category.findByPk(id, {
        include: [
            {
                model: Category,
                as: 'parent',
                attributes: ['id', 'name', 'slug', 'isActive']
            },
            {
                model: Category,
                as: 'children',
                attributes: ['id', 'name', 'slug', 'isActive']
            }
        ]
    });

    return sendSuccess(
        res,
        activateChildren 
            ? 'Category and its children activated successfully'
            : 'Category activated successfully',
        updatedCategory
    );
});

export {
    createCategory,
    getAllCategories,
    getCategoryById,
    getCategoryBySlug,
    updateCategory,
    deleteCategory,
    getCategoryTree,
    suspendCategory,
    activateCategory
};