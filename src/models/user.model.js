import { DataTypes } from 'sequelize';
import sequelize from '../db/index.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(215),
    allowNull: false,
    field: 'name',
    comment: 'Fullname of customer',
    validate: {
      len: [1, 215],
      notEmpty: true
    }
  },
  username: {
    type: DataTypes.STRING(215),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 215],
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
  phone: {
    type: DataTypes.STRING(11),
    allowNull: true,
    defaultValue: null,
    validate: {
      len: [0, 11]
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
  otp: {
    type: DataTypes.INTEGER(6),
    allowNull: true,
    defaultValue: null
  },
  otpExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'otp_expires_at'
  },
  role: {
    type: DataTypes.ENUM('admin', 'agent', 'customer'),
    allowNull: false,
    defaultValue: 'customer'
  },
  // profilePicture: {
  //   type: DataTypes.TEXT,
  //   allowNull: true,
  //   defaultValue: null,
  //   field: 'profile_picture',
  //   comment: 'JSON string containing profile picture paths for different sizes'
  // },
  isVerified: {
    type: DataTypes.ENUM('0', '1'),
    allowNull: false,
    defaultValue: '0',
    field: 'is_verified',
    comment: '0 = unverified, 1 = verified'
  },
  isActive: {
    type: DataTypes.ENUM('0', '1'),
    allowNull: false,
    defaultValue: '1',
    field: 'is_active',
    comment: '1 = Active, 0 = Suspend'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'last_login_at'
  },
  createdOn: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_on'
  },
  createdBy: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    field: 'created_by'
  },
  updatedOn: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'updated_on'
  },
  updatedBy: {
    type: DataTypes.INTEGER(11),
    allowNull: true,
    defaultValue: null,
    field: 'updated_by'
  }
}, {
  tableName: 'users',
  timestamps: false, // Disable Sequelize's automatic timestamps since we're using custom fields
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['username']
    },
    {
      fields: ['role']
    }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const saltRounds = 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
      // Set created_on timestamp
      user.createdOn = new Date();
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const saltRounds = 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
      // Set updated_on timestamp
      user.updatedOn = new Date();
    }
  }
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  delete values.otp; // Also hide OTP from responses
  return values;
};

// Helper methods for verification status
User.prototype.isVerifiedUser = function() {
  return this.isVerified === '1';
};

User.prototype.isActiveUser = function() {
  return this.isActive === '1';
};

User.prototype.markAsVerified = async function() {
  return await this.update({ isVerified: '1' });
};

User.prototype.deactivateUser = async function() {
  return await this.update({ isActive: '0' });
};

User.prototype.activateUser = async function() {
  return await this.update({ isActive: '1' });
};

// OTP related methods
User.prototype.setOTP = async function(otp) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  return await this.update({ 
    otp: otp,
    otpExpiresAt: expiresAt 
  });
};

User.prototype.verifyOTP = function(otp) {
  if (!this.otp || !this.otpExpiresAt) {
    return false;
  }
  
  // Check if OTP has expired
  if (new Date() > this.otpExpiresAt) {
    return false;
  }
  
  // Check if OTP matches
  return this.otp.toString() === otp.toString();
};

User.prototype.clearOTP = async function() {
  return await this.update({ 
    otp: null,
    otpExpiresAt: null 
  });
};

// Class methods
User.findByEmail = function(email) {
  return this.findOne({ where: { email } });
};

User.findByUsername = function(username) {
  return this.findOne({ where: { username } });
};

User.findActiveUsers = function() {
  return this.findAll({ where: { isActive: '1' } });
};

User.findVerifiedUsers = function() {
  return this.findAll({ where: { isVerified: '1' } });
};

User.findByRole = function(role) {
  return this.findAll({ where: { role } });
};

export default User;
