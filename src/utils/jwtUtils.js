import jwt from 'jsonwebtoken';
import { ApiError } from './ApiError.js';
import { HTTP_STATUS } from '../constants.js';

// Generate JWT Token
export const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRE || '7d';

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secret, { expiresIn });
};

// Verify JWT Token
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
    }
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Token verification failed');
  }
};

// Generate Access and Refresh Tokens
export const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  };

  const accessToken = generateToken(payload);
  
  // Refresh token with longer expiry
  const refreshTokenPayload = {
    id: user.id,
    type: 'refresh'
  };
  
  const refreshToken = jwt.sign(
    refreshTokenPayload, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );

  return {
    accessToken,
    refreshToken
  };
};

// Extract token from Authorization header
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authorization header is required');
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authorization header must start with Bearer');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  if (!token) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Token is required');
  }

  return token;
};

// Get token expiry date from JWT payload
export const getTokenExpiry = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000); // Convert from Unix timestamp to Date
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Decode token without verification (for debugging)
export const decodeToken = (token) => {
  return jwt.decode(token);
};