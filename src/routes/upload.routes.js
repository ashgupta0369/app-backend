import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { 
  uploadSingle, 
  uploadMultiple, 
  deleteImage, 
  getImageUrls,
  validateImageDimensions 
} from '../utils/uploadImage.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// @desc    Upload single image (general purpose)
// @route   POST /api/upload/single
// @access  Private
const uploadSingleImage = asyncHandler(async (req, res) => {
  // Image processing is done by middleware
  const imageInfo = req.uploadedImage;
  const imageUrls = getImageUrls(imageInfo.paths, req);

  return sendSuccess(res, 'Image uploaded successfully', {
    image: imageUrls,
    uploadInfo: {
      originalName: imageInfo.originalName,
      fileName: imageInfo.fileName,
      size: imageInfo.size,
      paths: imageInfo.paths
    }
  });
});

// @desc    Upload multiple images (up to 5)
// @route   POST /api/upload/multiple
// @access  Private
const uploadMultipleImages = asyncHandler(async (req, res) => {
  // Images processing is done by middleware
  const imagesInfo = req.uploadedImages;
  
  const imagesData = imagesInfo.map(imageInfo => ({
    urls: getImageUrls(imageInfo.paths, req),
    uploadInfo: {
      originalName: imageInfo.originalName,
      fileName: imageInfo.fileName,
      size: imageInfo.size,
      paths: imageInfo.paths
    }
  }));

  return sendSuccess(res, `${imagesInfo.length} images uploaded successfully`, {
    images: imagesData,
    totalCount: imagesInfo.length
  });
});

// @desc    Upload category image
// @route   POST /api/upload/category
// @access  Private
const uploadCategoryImage = asyncHandler(async (req, res) => {
  const imageInfo = req.uploadedImage;
  const imageUrls = getImageUrls(imageInfo.paths, req);

  return sendSuccess(res, 'Category image uploaded successfully', {
    categoryImage: imageUrls,
    uploadInfo: {
      originalName: imageInfo.originalName,
      fileName: imageInfo.fileName,
      size: imageInfo.size
    }
  });
});

// @desc    Upload with validation (specific dimensions)
// @route   POST /api/upload/validated
// @access  Private
const uploadValidatedImage = asyncHandler(async (req, res) => {
  // Additional validation can be done here
  const imageInfo = req.uploadedImage;
  const imageUrls = getImageUrls(imageInfo.paths, req);

  return sendSuccess(res, 'Validated image uploaded successfully', {
    image: imageUrls,
    uploadInfo: {
      originalName: imageInfo.originalName,
      fileName: imageInfo.fileName,
      size: imageInfo.size
    }
  });
});

// Routes
router.post('/single', 
  authenticateToken, 
  uploadSingle('image', 'general'), 
  uploadSingleImage
);

router.post('/multiple', 
  authenticateToken, 
  uploadMultiple('images', 5, 'gallery'), 
  uploadMultipleImages
);

router.post('/category', 
  authenticateToken, 
  uploadSingle('categoryImage', 'category'), 
  uploadCategoryImage
);

router.post('/validated', 
  authenticateToken, 
  uploadSingle('image', 'validated'), 
  uploadValidatedImage
);

export default router;