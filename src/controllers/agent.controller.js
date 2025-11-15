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
import { HTTP_STATUS, GENERAL_MESSAGES, AGENT_MESSAGES } from '../constants.js';
import Agent from '../models/agent.model.js';
import { generateTokens, getTokenExpiry } from '../utils/jwtUtils.js';
import tokenBlacklist from '../utils/tokenBlacklist.js';

// @desc    Register a new agent
// @route   POST /api/agents/register
// @access  Public
const registerAgent = asyncHandler(async (req, res) => {
    const {
        name,
        email,
        phone,
        password,
        licenseNumber,
        experienceYears,
        specializations,
        hourlyRate,
        businessName,
        baseAddress,
        city,
        state,
        zipcode,
        bio
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Name, email, phone, and password are required'
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

    // Validate phone format
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    if (!phoneRegex.test(phone)) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Please provide a valid phone number'
        );
    }

    // Check if agent already exists
    const existingAgentByEmail = await Agent.findByEmail(email);
    if (existingAgentByEmail) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            AGENT_MESSAGES.EMAIL_EXISTS
        );
    }

    const existingAgentByPhone = await Agent.findByPhone(phone);
    if (existingAgentByPhone) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            AGENT_MESSAGES.PHONE_EXISTS
        );
    }

    // Check if license number already exists (if provided)
    if (licenseNumber) {
        const existingAgentByLicense = await Agent.findByLicenseNumber(licenseNumber);
        if (existingAgentByLicense) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                AGENT_MESSAGES.LICENSE_EXISTS
            );
        }
    }

    // Handle profile picture upload if exists
    let profilePicturePath = null;
    if (req.file) {
        profilePicturePath = `/uploads/images/agents/${req.file.filename}`;
    }

    // Create agent in database
    const newAgent = await Agent.create({
        name,
        email,
        phone,
        password, // Will be hashed automatically by the model hook
        profilePicture: profilePicturePath,
        licenseNumber: licenseNumber || null,
        experienceYears: experienceYears || 0,
        specializations: specializations || [],
        hourlyRate: hourlyRate || 0,
        businessName: businessName || null,
        baseAddress: baseAddress || null,
        city: city || null,
        state: state || null,
        zipcode: zipcode || null,
        bio: bio || null,
        verificationStatus: 'pending',
        availabilityStatus: 'offline',
        isActive: true,
        backgroundCheckStatus: 'pending'
    });

    // Remove sensitive data from response
    const agentData = {
        agentId: newAgent.agentId,
        name: newAgent.name,
        email: newAgent.email,
        phone: newAgent.phone,
        profilePicture: newAgent.profilePicture,
        licenseNumber: newAgent.licenseNumber,
        experienceYears: newAgent.experienceYears,
        specializations: newAgent.specializations,
        hourlyRate: newAgent.hourlyRate,
        verificationStatus: newAgent.verificationStatus,
        availabilityStatus: newAgent.availabilityStatus,
        createdAt: newAgent.createdAt
    };

    return sendCreated(
        res,
        AGENT_MESSAGES.REGISTRATION_SUCCESS,
        agentData
    );
});

// @desc    Login agent
// @route   POST /api/agents/login
// @access  Public
const loginAgent = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Email and password are required'
        );
    }

    // Find agent by email
    const agent = await Agent.findByEmail(email);
    if (!agent) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'Invalid email or password'
        );
    }

    // Check if agent is active
    if (!agent.isActiveAgent()) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            AGENT_MESSAGES.ACCOUNT_INACTIVE
        );
    }

    // Check verification status
    if (agent.verificationStatus === 'pending') {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            AGENT_MESSAGES.ACCOUNT_PENDING
        );
    }

    if (agent.verificationStatus === 'rejected') {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            AGENT_MESSAGES.ACCOUNT_REJECTED
        );
    }

    // Validate password
    const isPasswordValid = await agent.validatePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'Invalid email or password'
        );
    }

    // Update last active time
    await agent.update({ lastActiveAt: new Date() });

    // Generate JWT tokens
    const payload = {
        id: agent.agentId,
        email: agent.email,
        name: agent.name,
        role: 'agent'
    };
    const { accessToken, refreshToken } = generateTokens({ ...agent.toJSON(), ...payload });

    // Prepare agent data for response
    const agentData = {
        agentId: agent.agentId,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        profilePicture: agent.profilePicture,
        licenseNumber: agent.licenseNumber,
        experienceYears: agent.experienceYears,
        specializations: agent.specializations,
        hourlyRate: agent.hourlyRate,
        availabilityStatus: agent.availabilityStatus,
        verificationStatus: agent.verificationStatus,
        rating: agent.rating,
        totalJobsCompleted: agent.totalJobsCompleted,
        lastActiveAt: agent.lastActiveAt
    };

    // Set HTTP-only cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return sendSuccess(
        res,
        AGENT_MESSAGES.LOGIN_SUCCESS,
        {
            agent: agentData,
            accessToken,
            tokenType: 'Bearer',
            expiresIn: process.env.JWT_EXPIRE || '7d'
        }
    );
});

// @desc    Get current agent profile
// @route   GET /api/agents/me
// @access  Private (Agent)
const getCurrentAgent = asyncHandler(async (req, res) => {
    const agentId = req.user?.id;

    if (!agentId) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'Agent not authenticated'
        );
    }

    // Find agent by ID
    const agent = await Agent.findByPk(agentId);
    if (!agent) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            AGENT_MESSAGES.NOT_FOUND
        );
    }

    // Check if agent is still active
    if (!agent.isActiveAgent()) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            AGENT_MESSAGES.ACCOUNT_INACTIVE
        );
    }

    // Return full agent data
    const agentData = agent.toJSON();

    return sendSuccess(
        res,
        AGENT_MESSAGES.PROFILE_RETRIEVED,
        agentData
    );
});

// @desc    Update agent profile
// @route   PUT /api/agents/me
// @access  Private (Agent)
const updateAgentProfile = asyncHandler(async (req, res) => {
    const agentId = req.user?.id;

    if (!agentId) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'Agent not authenticated'
        );
    }

    const agent = await Agent.findByPk(agentId);
    if (!agent) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            AGENT_MESSAGES.NOT_FOUND
        );
    }

    // Fields that can be updated
    const {
        name,
        phone,
        licenseNumber,
        experienceYears,
        hourlyRate,
        businessName,
        taxId,
        insuranceDetails,
        certifications,
        baseAddress,
        city,
        state,
        zipcode,
        bio,
        emergencyContactName,
        emergencyContactPhone,
        serviceRadius
    } = req.body;

    // Check if phone is being changed and if it's already taken
    if (phone && phone !== agent.phone) {
        const existingAgent = await Agent.findByPhone(phone);
        if (existingAgent) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                AGENT_MESSAGES.PHONE_EXISTS
            );
        }
    }

    // Check if license number is being changed and if it's already taken
    if (licenseNumber && licenseNumber !== agent.licenseNumber) {
        const existingAgent = await Agent.findByLicenseNumber(licenseNumber);
        if (existingAgent) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                AGENT_MESSAGES.LICENSE_EXISTS
            );
        }
    }

    // Handle profile picture upload if exists
    let updateData = {
        name: name || agent.name,
        phone: phone || agent.phone,
        licenseNumber: licenseNumber || agent.licenseNumber,
        experienceYears: experienceYears !== undefined ? experienceYears : agent.experienceYears,
        hourlyRate: hourlyRate !== undefined ? hourlyRate : agent.hourlyRate,
        businessName: businessName !== undefined ? businessName : agent.businessName,
        taxId: taxId !== undefined ? taxId : agent.taxId,
        insuranceDetails: insuranceDetails !== undefined ? insuranceDetails : agent.insuranceDetails,
        certifications: certifications !== undefined ? certifications : agent.certifications,
        baseAddress: baseAddress !== undefined ? baseAddress : agent.baseAddress,
        city: city !== undefined ? city : agent.city,
        state: state !== undefined ? state : agent.state,
        zipcode: zipcode !== undefined ? zipcode : agent.zipcode,
        bio: bio !== undefined ? bio : agent.bio,
        emergencyContactName: emergencyContactName !== undefined ? emergencyContactName : agent.emergencyContactName,
        emergencyContactPhone: emergencyContactPhone !== undefined ? emergencyContactPhone : agent.emergencyContactPhone,
        serviceRadius: serviceRadius !== undefined ? serviceRadius : agent.serviceRadius
    };

    if (req.file) {
        updateData.profilePicture = `/uploads/images/agents/${req.file.filename}`;
    }

    // Update agent
    await agent.update(updateData);

    return sendSuccess(
        res,
        AGENT_MESSAGES.PROFILE_UPDATED,
        agent.toJSON()
    );
});

// @desc    Logout agent
// @route   POST /api/agents/logout
// @access  Private (Agent)
const logoutAgent = asyncHandler(async (req, res) => {
    const agentId = req.user?.id;
    const token = req.token;

    if (!agentId) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'Agent not authenticated'
        );
    }

    // Find agent and set to offline
    const agent = await Agent.findByPk(agentId);
    if (agent) {
        await agent.setOffline();
    }

    // Add token to blacklist
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
        AGENT_MESSAGES.LOGOUT_SUCCESS,
        null
    );
});

// @desc    Update agent location
// @route   PUT /api/agents/location
// @access  Private (Agent)
const updateLocation = asyncHandler(async (req, res) => {
    const agentId = req.user?.id;
    const { latitude, longitude } = req.body;

    if (!agentId) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'Agent not authenticated'
        );
    }

    if (!latitude || !longitude) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Latitude and longitude are required'
        );
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Invalid latitude. Must be between -90 and 90'
        );
    }

    if (longitude < -180 || longitude > 180) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Invalid longitude. Must be between -180 and 180'
        );
    }

    const agent = await Agent.findByPk(agentId);
    if (!agent) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            AGENT_MESSAGES.NOT_FOUND
        );
    }

    await agent.updateLocation(latitude, longitude);

    return sendSuccess(
        res,
        AGENT_MESSAGES.LOCATION_UPDATED,
        {
            currentLatitude: agent.currentLatitude,
            currentLongitude: agent.currentLongitude,
            lastActiveAt: agent.lastActiveAt
        }
    );
});

// @desc    Update agent availability status
// @route   PUT /api/agents/availability
// @access  Private (Agent)
const updateAvailability = asyncHandler(async (req, res) => {
    const agentId = req.user?.id;
    const { status } = req.body;

    if (!agentId) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'Agent not authenticated'
        );
    }

    if (!status) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Status is required'
        );
    }

    const validStatuses = ['available', 'busy', 'offline'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Invalid status. Must be available, busy, or offline'
        );
    }

    const agent = await Agent.findByPk(agentId);
    if (!agent) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            AGENT_MESSAGES.NOT_FOUND
        );
    }

    // Update availability based on status
    if (status === 'available') {
        await agent.setAvailable();
    } else if (status === 'busy') {
        await agent.setBusy();
    } else {
        await agent.setOffline();
    }

    return sendSuccess(
        res,
        AGENT_MESSAGES.AVAILABILITY_UPDATED,
        {
            availabilityStatus: agent.availabilityStatus,
            lastActiveAt: agent.lastActiveAt
        }
    );
});

// @desc    Add specialization
// @route   POST /api/agents/specializations
// @access  Private (Agent)
const addSpecialization = asyncHandler(async (req, res) => {
    const agentId = req.user?.id;
    const { category } = req.body;

    if (!agentId) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'Agent not authenticated'
        );
    }

    if (!category) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Category is required'
        );
    }

    const agent = await Agent.findByPk(agentId);
    if (!agent) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            AGENT_MESSAGES.NOT_FOUND
        );
    }

    await agent.addSpecialization(category);

    return sendSuccess(
        res,
        AGENT_MESSAGES.SPECIALIZATION_ADDED,
        { specializations: agent.specializations }
    );
});

// @desc    Remove specialization
// @route   DELETE /api/agents/specializations/:category
// @access  Private (Agent)
const removeSpecialization = asyncHandler(async (req, res) => {
    const agentId = req.user?.id;
    const { category } = req.params;

    if (!agentId) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            'Agent not authenticated'
        );
    }

    const agent = await Agent.findByPk(agentId);
    if (!agent) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            AGENT_MESSAGES.NOT_FOUND
        );
    }

    await agent.removeSpecialization(category);

    return sendSuccess(
        res,
        AGENT_MESSAGES.SPECIALIZATION_REMOVED,
        { specializations: agent.specializations }
    );
});

// @desc    Get all agents (with filters)
// @route   GET /api/agents
// @access  Public
const getAllAgents = asyncHandler(async (req, res) => {
    const { 
        city, 
        state, 
        specialization, 
        minRating,
        maxHourlyRate,
        available,
        page = 1,
        limit = 10
    } = req.query;

    // Build where clause
    let whereClause = {
        verificationStatus: 'verified',
        isActive: true
    };

    if (city) whereClause.city = city;
    if (state) whereClause.state = state;
    if (minRating) whereClause.rating = { [Op.gte]: parseFloat(minRating) };
    if (maxHourlyRate) whereClause.hourlyRate = { [Op.lte]: parseFloat(maxHourlyRate) };
    if (available === 'true') whereClause.availabilityStatus = 'available';

    // Calculate offset
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Find agents
    const { rows: agents, count } = await Agent.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset,
        order: [['rating', 'DESC'], ['totalJobsCompleted', 'DESC']]
    });

    // Filter by specialization if provided (JSON field)
    let filteredAgents = agents;
    if (specialization) {
        filteredAgents = agents.filter(agent => 
            agent.hasSpecialization(specialization)
        );
    }

    return sendSuccess(
        res,
        'Agents retrieved successfully',
        {
            agents: filteredAgents.map(agent => agent.toJSON()),
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        }
    );
});

// @desc    Get agent by ID
// @route   GET /api/agents/:id
// @access  Public
const getAgentById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const agent = await Agent.findByPk(id);
    if (!agent) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            AGENT_MESSAGES.NOT_FOUND
        );
    }

    // Only return if verified and active
    if (!agent.isVerified() || !agent.isActiveAgent()) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            AGENT_MESSAGES.NOT_FOUND
        );
    }

    return sendSuccess(
        res,
        'Agent retrieved successfully',
        agent.toJSON()
    );
});

export {
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
};
