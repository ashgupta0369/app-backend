import { DataTypes } from 'sequelize';
import sequelize from '../db/index.js';
import bcrypt from 'bcryptjs';

const Agent = sequelize.define('Agent', {
    agentId: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        field: 'agent_id'
    },
    // Identity & Contact Information
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: [1, 100],
            notEmpty: true
        }
    },
    phone: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: [6, 255],
            notEmpty: true
        }
    },
    profilePicture: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
        field: 'profile_picture'
    },

    // Professional Information
    licenseNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
        field: 'license_number'
    },
    experienceYears: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        field: 'experience_years',
        validate: {
            min: 0
        }
    },
    specializations: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Array of service categories'
    },
    hourlyRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00,
        field: 'hourly_rate',
        validate: {
            min: 0
        }
    },
    availabilityStatus: {
        type: DataTypes.ENUM('available', 'busy', 'offline'),
        allowNull: false,
        defaultValue: 'offline',
        field: 'availability_status'
    },

    // Business Details
    businessName: {
        type: DataTypes.STRING(150),
        allowNull: true,
        defaultValue: null,
        field: 'business_name'
    },
    taxId: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
        field: 'tax_id'
    },
    insuranceDetails: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
        field: 'insurance_details'
    },
    certifications: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Array of certifications'
    },

    // Location & Service Area
    currentLatitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        defaultValue: null,
        field: 'current_latitude'
    },
    currentLongitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        defaultValue: null,
        field: 'current_longitude'
    },
    serviceRadius: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 10,
        field: 'service_radius',
        comment: 'Service radius in kilometers'
    },
    baseAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
        field: 'base_address'
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null
    },
    state: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null
    },
    zipcode: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: null
    },

    // Platform Management
    verificationStatus: {
        type: DataTypes.ENUM('pending', 'verified', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
        field: 'verification_status'
    },
    rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0.00,
        comment: 'Average rating out of 5',
        validate: {
            min: 0,
            max: 5
        }
    },
    totalJobsCompleted: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        field: 'total_jobs_completed',
        validate: {
            min: 0
        }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active'
    },
    backgroundCheckStatus: {
        type: DataTypes.ENUM('pending', 'cleared', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
        field: 'background_check_status'
    },

    // Additional Information
    bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
    },
    documents: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Store uploaded document references'
    },
    emergencyContactName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
        field: 'emergency_contact_name'
    },
    emergencyContactPhone: {
        type: DataTypes.STRING(15),
        allowNull: true,
        defaultValue: null,
        field: 'emergency_contact_phone'
    },

    // Timestamps
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
    },
    lastActiveAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
        field: 'last_active_at'
    }
}, {
    tableName: 'agents',
    timestamps: false, // Using custom timestamp fields
    indexes: [
        {
            unique: true,
            fields: ['phone']
        },
        {
            unique: true,
            fields: ['email']
        },
        {
            unique: true,
            fields: ['license_number']
        },
        {
            fields: ['current_latitude', 'current_longitude']
        },
        {
            fields: ['verification_status']
        },
        {
            fields: ['availability_status']
        },
        {
            fields: ['city', 'state']
        }
    ],
    hooks: {
        beforeCreate: async (agent) => {
            if (agent.password) {
                const saltRounds = 12;
                agent.password = await bcrypt.hash(agent.password, saltRounds);
            }
            // Set created_at timestamp
            agent.createdAt = new Date();
            agent.updatedAt = new Date();
        },
        beforeUpdate: async (agent) => {
            if (agent.changed('password')) {
                const saltRounds = 12;
                agent.password = await bcrypt.hash(agent.password, saltRounds);
            }
            // Set updated_at timestamp
            agent.updatedAt = new Date();
        }
    }
});

// Instance methods
Agent.prototype.validatePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

Agent.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    return values;
};

// Verification status methods
Agent.prototype.isVerified = function () {
    return this.verificationStatus === 'verified';
};

Agent.prototype.isPending = function () {
    return this.verificationStatus === 'pending';
};

Agent.prototype.isRejected = function () {
    return this.verificationStatus === 'rejected';
};

Agent.prototype.markAsVerified = async function () {
    return await this.update({ verificationStatus: 'verified' });
};

Agent.prototype.markAsRejected = async function () {
    return await this.update({ verificationStatus: 'rejected' });
};

// Active status methods
Agent.prototype.isActiveAgent = function () {
    return this.isActive === true;
};

Agent.prototype.deactivate = async function () {
    return await this.update({ isActive: false, availabilityStatus: 'offline' });
};

Agent.prototype.activate = async function () {
    return await this.update({ isActive: true });
};

// Availability status methods
Agent.prototype.setAvailable = async function () {
    if (this.isActive) {
        return await this.update({
            availabilityStatus: 'available',
            lastActiveAt: new Date()
        });
    }
    throw new Error('Cannot set availability for inactive agent');
};

Agent.prototype.setBusy = async function () {
    return await this.update({
        availabilityStatus: 'busy',
        lastActiveAt: new Date()
    });
};

Agent.prototype.setOffline = async function () {
    return await this.update({ availabilityStatus: 'offline' });
};

Agent.prototype.isAvailable = function () {
    return this.availabilityStatus === 'available' && this.isActive;
};

// Location methods
Agent.prototype.updateLocation = async function (latitude, longitude) {
    return await this.update({
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastActiveAt: new Date()
    });
};

Agent.prototype.hasLocation = function () {
    return this.currentLatitude !== null && this.currentLongitude !== null;
};

// Rating and jobs methods
Agent.prototype.updateRating = async function (newRating) {
    // Calculate new average rating
    const totalRatings = this.totalJobsCompleted;
    const currentTotal = this.rating * totalRatings;
    const newTotal = currentTotal + newRating;
    const updatedRating = newTotal / (totalRatings + 1);

    return await this.update({
        rating: updatedRating.toFixed(2),
        totalJobsCompleted: totalRatings + 1
    });
};

Agent.prototype.incrementJobsCompleted = async function () {
    return await this.update({
        totalJobsCompleted: this.totalJobsCompleted + 1
    });
};

// Background check methods
Agent.prototype.isBackgroundCheckCleared = function () {
    return this.backgroundCheckStatus === 'cleared';
};

Agent.prototype.markBackgroundCheckCleared = async function () {
    return await this.update({ backgroundCheckStatus: 'cleared' });
};

Agent.prototype.markBackgroundCheckFailed = async function () {
    return await this.update({
        backgroundCheckStatus: 'failed',
        isActive: false
    });
};

// Specialization methods
Agent.prototype.hasSpecialization = function (category) {
    if (!this.specializations || !Array.isArray(this.specializations)) {
        return false;
    }
    return this.specializations.includes(category);
};

Agent.prototype.addSpecialization = async function (category) {
    const specializations = this.specializations || [];
    if (!specializations.includes(category)) {
        specializations.push(category);
        return await this.update({ specializations });
    }
    return this;
};

Agent.prototype.removeSpecialization = async function (category) {
    const specializations = this.specializations || [];
    const filtered = specializations.filter(s => s !== category);
    return await this.update({ specializations: filtered });
};

// Class methods
Agent.findByEmail = function (email) {
    return this.findOne({ where: { email } });
};

Agent.findByPhone = function (phone) {
    return this.findOne({ where: { phone } });
};

Agent.findByLicenseNumber = function (licenseNumber) {
    return this.findOne({ where: { licenseNumber } });
};

Agent.findActiveAgents = function () {
    return this.findAll({ where: { isActive: true } });
};

Agent.findVerifiedAgents = function () {
    return this.findAll({
        where: {
            verificationStatus: 'verified',
            isActive: true
        }
    });
};

Agent.findAvailableAgents = function () {
    return this.findAll({
        where: {
            availabilityStatus: 'available',
            verificationStatus: 'verified',
            isActive: true,
            backgroundCheckStatus: 'cleared'
        }
    });
};

Agent.findByCity = function (city) {
    return this.findAll({
        where: {
            city,
            isActive: true,
            verificationStatus: 'verified'
        }
    });
};

Agent.findBySpecialization = function (specialization) {
    return this.findAll({
        where: sequelize.literal(`JSON_CONTAINS(specializations, '"${specialization}"')`),
        isActive: true,
        verificationStatus: 'verified'
    });
};

Agent.findPendingVerification = function () {
    return this.findAll({ where: { verificationStatus: 'pending' } });
};

Agent.findTopRated = function (limit = 10) {
    return this.findAll({
        where: {
            verificationStatus: 'verified',
            isActive: true
        },
        order: [['rating', 'DESC']],
        limit
    });
};

export default Agent;
