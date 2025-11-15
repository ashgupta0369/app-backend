import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {
    ApiResponse,
    sendCreated,
    sendSuccess,
    sendBadRequest,
    sendUnauthorized,
    sendNotFound
} from '../utils/ApiResponse.js';
import { HTTP_STATUS, USER_MESSAGES, GENERAL_MESSAGES } from '../constants.js';
import User from '../models/user.model.js';
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from '../utils/emailService.js';
import { generateTokens, getTokenExpiry } from '../utils/jwtUtils.js';
import { deleteImage } from '../utils/uploadImage.js';
import jwt from 'jsonwebtoken';
import tokenBlacklist from '../utils/tokenBlacklist.js';

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    // Extract data from request body
    const {
        username,
        email,
        password,
        name,
        phone,
        role,
        createdBy
    } = req.body;
    // Validate required fields
    if (!username || !email || !password || !name) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Username, email, password, and name are required'
        );
    }

    // Validate createdBy field
    if (!createdBy) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'createdBy field is required'
        );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Please provide a valid email address'
        );
    }

    // Validate password strength
    if (password.length < 6) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Password must be at least 6 characters long'
        );
    }

    // Check if user already exists with email or username
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            USER_MESSAGES.EMAIL_EXISTS
        );
    }

    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            USER_MESSAGES.USERNAME_EXISTS
        );
    }

    // Validate role if provided
    const validRoles = ['admin', 'mechanic', 'customer'];
    const userRole = role || 'customer';
    if (!validRoles.includes(userRole)) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Invalid role. Must be admin, mechanic, or customer'
        );
    }

    // Create user in database
    const newUser = await User.create({
        username,
        email,
        password, // Will be hashed automatically by the model hook
        name,
        phone,
        role: userRole,
        createdBy,
        isVerified: '0', // Default unverified
        isActive: '1', // Default active
        createdOn: new Date()
    });

    // Generate OTP and send verification email
    try {
        const otp = generateOTP();
        await newUser.setOTP(otp);
        await sendOTPEmail(email, name, otp);

    } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
    }

    // Remove sensitive data from response
    const userData = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
        isVerified: newUser.isVerified,
        isActive: newUser.isActive,
        createdOn: newUser.createdOn
    };

    return sendCreated(
        res,
        USER_MESSAGES.REGISTRATION_SUCCESS,
        userData
    );
});

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Email and password are required'
        );
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'Invalid email or password'
        );
    }

    // Check if user is active
    if (!user.isActiveUser()) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'Account is deactivated. Please contact support'
        );
    }

    // Check if user is verified
    if (!user.isVerifiedUser()) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'Please verify your email address before logging in. Check your email for verification code.'
        );
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'Invalid email or password'
        );
    }

    // Update last login time
    await user.update({ lastLoginAt: new Date() });

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Prepare user data for response (excluding password)
    const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt
    };

    // Set HTTP-only cookie for refresh token (optional)
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return sendSuccess(
        res,
        USER_MESSAGES.LOGIN_SUCCESS,
        {
            user: userData,
            accessToken,
            tokenType: 'Bearer',
            expiresIn: process.env.JWT_EXPIRE || '7d'
        }
    );
});

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getCurrentUser = asyncHandler(async (req, res) => {
    // Get user ID from authenticated request (set by auth middleware)
    const userId = req.user?.id;

    if (!userId) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'User not authenticated'
        );
    }

    // Find user by ID
    const user = await User.findByPk(userId);
    if (!user) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            'User not found'
        );
    }

    // Check if user is still active
    if (!user.isActiveUser()) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'Account is deactivated'
        );
    }

    // Prepare user data for response
    const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdOn: user.createdOn,
        updatedOn: user.updatedOn,
        // profilePicture: user.profilePicture ? getImageUrls(JSON.parse(user.profilePicture), req) : null
    };

    return sendSuccess(
        res,
        USER_MESSAGES.PROFILE_RETRIEVED,
        userData
    );
});

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
    // Get user ID from authenticated request
    const userId = req.user?.id;
    const token = req.token; // Token attached by auth middleware

    if (!userId) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'User not authenticated'
        );
    }

    // Add token to blacklist if available
    if (token) {
        const tokenExpiry = getTokenExpiry(token);
        if (tokenExpiry) {
            tokenBlacklist.addToken(token, tokenExpiry);
        }
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    return sendSuccess(
        res,
        USER_MESSAGES.LOGOUT_SUCCESS,
        null
    );
});

// @desc    Verify user email with OTP
// @route   POST /api/users/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    // Validate required fields
    if (!email || !otp) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Email and OTP are required'
        );
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            'User not found'
        );
    }

    // Check if user is already verified
    if (user.isVerifiedUser()) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Email is already verified'
        );
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Invalid or expired OTP'
        );
    }

    // Mark user as verified and clear OTP
    await user.markAsVerified();
    await user.clearOTP();

    // Send welcome email
    try {
        await sendWelcomeEmail(email, user.name);
    } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the verification process if welcome email fails
    }

    return sendSuccess(
        res,
        USER_MESSAGES.EMAIL_VERIFIED,
        { verified: true }
    );
});

// @desc    Resend OTP for email verification
// @route   POST /api/users/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Validate required fields
    if (!email) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Email is required'
        );
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            'User not found'
        );
    }

    // Check if user is already verified
    if (user.isVerifiedUser()) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Email is already verified'
        );
    }

    // Generate new OTP and send email
    try {
        const otp = generateOTP();
        await user.setOTP(otp);
        await sendOTPEmail(email, user.name, otp);

    } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        throw new ApiError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            'Failed to send verification email'
        );
    }

    return sendSuccess(
        res,
        GENERAL_MESSAGES.OTP_SENT,
        null
    );
});

// @desc    Refresh access token
// @route   POST /api/users/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken: token } = req.body;
    const cookieRefreshToken = req.cookies?.refreshToken;

    const refreshTokenToUse = token || cookieRefreshToken;

    if (!refreshTokenToUse) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'Refresh token is required'
        );
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshTokenToUse, process.env.JWT_SECRET);
        
        if (decoded.type !== 'refresh') {
            throw new ApiError(
                HTTP_STATUS.UNAUTHORIZED,
                'Invalid refresh token'
            );
        }

        // Find user
        const user = await User.findByPk(decoded.id);
        if (!user) {
            throw new ApiError(
                HTTP_STATUS.UNAUTHORIZED,
                'Invalid refresh token - user not found'
            );
        }

        // Check if user is still active
        if (!user.isActiveUser()) {
            throw new ApiError(
                HTTP_STATUS.UNAUTHORIZED,
                'Account has been deactivated'
            );
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

        // Update refresh token cookie
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        return sendSuccess(
            res,
            'Token refreshed successfully',
            {
                accessToken,
                tokenType: 'Bearer',
                expiresIn: process.env.JWT_EXPIRE || '7d'
            }
        );
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'Invalid or expired refresh token'
        );
    }
});

export {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    verifyEmail,
    resendOTP,
    refreshToken
};
