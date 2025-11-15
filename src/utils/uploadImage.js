import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ApiError } from './ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supported image formats
const ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Create upload directories if they don't exist
const createUploadDirs = async () => {
  const dirs = [
    path.join(process.cwd(), 'public', 'uploads'),
    path.join(process.cwd(), 'public', 'uploads', 'images'),
  ];

  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }
};

// Initialize upload directories
createUploadDirs().catch(console.error);

// Multer configuration for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (!file.mimetype.startsWith('image/')) {
    return cb(new ApiError(400, 'Only image files are allowed'), false);
  }

  // Check file extension
  const fileExtension = file.originalname.split('.').pop().toLowerCase();
  if (!ALLOWED_FORMATS.includes(fileExtension)) {
    return cb(new ApiError(400, `Only ${ALLOWED_FORMATS.join(', ')} formats are allowed`), false);
  }

  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: fileFilter,
});

// Generate unique filename
const generateFileName = (originalName, suffix = '') => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, extension);
  return `${baseName}_${timestamp}_${random}${suffix}${extension}`;
};

// Process and save single image
const processAndSaveImage = async (buffer, originalName, subFolder = '') => {
  try {
    const fileName = generateFileName(originalName);
    const baseDir = path.join(process.cwd(), 'public', 'uploads', 'images');
    
    // Create subfolder if specified
    if (subFolder) {
      await fs.ensureDir(path.join(baseDir, subFolder));
    }

    const imagePath = path.join(baseDir, subFolder, fileName);

    // Process and save single optimized image
    await sharp(buffer)
      .jpeg({ quality: 85 })
      .png({ compressionLevel: 8 })
      .webp({ quality: 85 })
      .toFile(imagePath);

    // Return relative path for database storage (just folder path)
    const relativePath = path.join('uploads', 'images', subFolder, fileName).replace(/\\/g, '/');

    return {
      success: true,
      originalName: originalName,
      fileName: fileName,
      path: relativePath, // Single path instead of multiple paths
      size: buffer.length,
    };
  } catch (error) {
    throw new ApiError(500, `Image processing failed: ${error.message}`);
  }
};

// Delete image file
const deleteImage = async (imagePath) => {
  try {
    const baseDir = path.join(process.cwd(), 'public');
    
    if (imagePath && typeof imagePath === 'string') {
      const fullPath = path.join(baseDir, imagePath);
      if (await fs.pathExists(fullPath)) {
        await fs.unlink(fullPath);
      }
    }
    
    return { success: true, message: 'Image deleted successfully' };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, message: error.message };
  }
};

// Middleware for single image upload
const uploadSingle = (fieldName, subFolder = '') => {
  return async (req, res, next) => {
    const multerSingle = upload.single(fieldName);
    
    multerSingle(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ApiError(400, 'File size too large. Maximum size is 5MB'));
          }
          return next(new ApiError(400, err.message));
        }
        return next(err);
      }

      if (!req.file) {
        return next(new ApiError(400, 'No image file provided'));
      }

      try {
        const result = await processAndSaveImage(req.file.buffer, req.file.originalname, subFolder);
        req.uploadedImage = result;
        next();
      } catch (error) {
        next(error);
      }
    });
  };
};

// Middleware for multiple image upload
const uploadMultiple = (fieldName, maxCount = 5, subFolder = '') => {
  return async (req, res, next) => {
    const multerMultiple = upload.array(fieldName, maxCount);
    
    multerMultiple(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ApiError(400, 'File size too large. Maximum size is 5MB'));
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(new ApiError(400, `Too many files. Maximum is ${maxCount}`));
          }
          return next(new ApiError(400, err.message));
        }
        return next(err);
      }

      if (!req.files || req.files.length === 0) {
        return next(new ApiError(400, 'No image files provided'));
      }

      try {
        const results = [];
        for (const file of req.files) {
          const result = await processAndSaveImage(file.buffer, file.originalname, subFolder);
          results.push(result);
        }
        req.uploadedImages = results;
        next();
      } catch (error) {
        next(error);
      }
    });
  };
};

// Get image URL helper - concatenates base URL with image path
const getImageUrl = (imagePath, req) => {
  if (!imagePath) return null;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/${imagePath}`;
};

// Get image URL from environment base URL (for cases where req is not available)
const getImageUrlWithBaseUrl = (imagePath, baseUrl = process.env.BASE_URL || 'http://localhost:3000') => {
  if (!imagePath) return null;
  return `${baseUrl}/${imagePath}`;
};

// Validate image dimensions
const validateImageDimensions = async (buffer, minWidth = 100, minHeight = 100, maxWidth = 4000, maxHeight = 4000) => {
  try {
    const metadata = await sharp(buffer).metadata();
    
    if (metadata.width < minWidth || metadata.height < minHeight) {
      throw new ApiError(400, `Image dimensions too small. Minimum: ${minWidth}x${minHeight}px`);
    }
    
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      throw new ApiError(400, `Image dimensions too large. Maximum: ${maxWidth}x${maxHeight}px`);
    }
    
    return { width: metadata.width, height: metadata.height };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'Invalid image file');
  }
};

export {
  upload,
  uploadSingle,
  uploadMultiple,
  processAndSaveImage,
  deleteImage,
  getImageUrl,
  getImageUrlWithBaseUrl,
  validateImageDimensions,
  ALLOWED_FORMATS,
  MAX_FILE_SIZE
};