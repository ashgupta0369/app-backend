import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const Address = sequelize.define('Address', {
    addressId: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        field: 'address_id'
    },
    userId: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    addressType: {
        type: DataTypes.ENUM('home', 'work', 'other'),
        allowNull: false,
        defaultValue: 'home',
        field: 'address_type',
        comment: 'Type of address'
    },
    isDefault: {
        type: DataTypes.ENUM('0', '1'),
        allowNull: false,
        defaultValue: '0',
        field: 'is_default',
        comment: '1 = Default address, 0 = Not default'
    },
    addressFor: {
        type: DataTypes.ENUM('self', 'other'),
        allowNull: false,
        defaultValue: 'self',
        field: 'address_for',
        comment: 'self = For logged in user, other = For someone else'
    },
    fullName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'full_name',
        validate: {
            len: [2, 100],
            notEmpty: true
        }
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: null,
        validate: {
            len: [10, 20]
        }
    },
    addressLine1: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'address_line_1',
        validate: {
            len: [5, 255],
            notEmpty: true
        }
    },
    addressLine2: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
        field: 'address_line_2',
        validate: {
            len: [0, 255]
        }
    },
    landmark: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
        validate: {
            len: [0, 100]
        }
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: [2, 100],
            notEmpty: true
        }
    },
    state: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: [2, 100],
            notEmpty: true
        }
    },
    postalCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'postal_code',
        validate: {
            len: [3, 20],
            notEmpty: true
        }
    },
    country: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'India',
        validate: {
            len: [2, 100],
            notEmpty: true
        }
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        defaultValue: null,
        comment: 'GPS latitude for location services',
        validate: {
            min: -90,
            max: 90
        }
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        defaultValue: null,
        comment: 'GPS longitude for location services',
        validate: {
            min: -180,
            max: 180
        }
    },
    instructions: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: 'Special delivery or service instructions'
    },
    isActive: {
        type: DataTypes.ENUM('0', '1'),
        allowNull: false,
        defaultValue: '1',
        field: 'is_active',
        comment: '1 = Active, 0 = Inactive'
    },
    createdOn: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_on'
    },
    createdBy: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        field: 'created_by',
        references: {
            model: 'users',
            key: 'id'
        }
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
        field: 'updated_by',
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'address',
    timestamps: false, // Using custom timestamp fields
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['address_type']
        },
        {
            fields: ['is_default']
        },
        {
            fields: ['address_for']
        },
        {
            fields: ['city', 'state']
        },
        {
            fields: ['postal_code']
        },
        {
            fields: ['is_active']
        },
        {
            fields: ['latitude', 'longitude']
        }
    ],
    hooks: {
        beforeCreate: async (address) => {
            // Set created_on timestamp
            address.createdOn = new Date();

            // If this is set as default, unset other default addresses for same user and address type
            if (address.isDefault === '1') {
                await Address.update(
                    { isDefault: '0' },
                    { 
                        where: { 
                            userId: address.userId,
                            addressType: address.addressType,
                            isActive: '1'
                        }
                    }
                );
            }
        },
        beforeUpdate: async (address) => {
            // Set updated_on timestamp
            address.updatedOn = new Date();

            // If this is being set as default, unset other default addresses
            if (address.changed('isDefault') && address.isDefault === '1') {
                await Address.update(
                    { isDefault: '0' },
                    { 
                        where: { 
                            userId: address.userId,
                            addressType: address.addressType,
                            addressId: { [sequelize.Sequelize.Op.ne]: address.addressId },
                            isActive: '1'
                        }
                    }
                );
            }
        }
    }
});

// Instance methods
Address.prototype.toJSON = function () {
    const values = { ...this.get() };
    return values;
};

// Helper methods for status
Address.prototype.isActiveAddress = function () {
    return this.isActive === '1';
};

Address.prototype.isDefaultAddress = function () {
    return this.isDefault === '1';
};

Address.prototype.activate = async function () {
    return await this.update({ isActive: '1' });
};

Address.prototype.deactivate = async function () {
    return await this.update({ isActive: '0' });
};

Address.prototype.setAsDefault = async function () {
    // Unset other default addresses for same user and type
    await Address.update(
        { isDefault: '0' },
        { 
            where: { 
                userId: this.userId,
                addressType: this.addressType,
                addressId: { [sequelize.Sequelize.Op.ne]: this.addressId },
                isActive: '1'
            }
        }
    );
    
    return await this.update({ isDefault: '1' });
};

Address.prototype.getFullAddress = function () {
    let fullAddress = this.addressLine1;
    if (this.addressLine2) fullAddress += ', ' + this.addressLine2;
    if (this.landmark) fullAddress += ', ' + this.landmark;
    fullAddress += ', ' + this.city + ', ' + this.state + ' ' + this.postalCode;
    if (this.country !== 'India') fullAddress += ', ' + this.country;
    return fullAddress;
};

// Class methods
Address.findByUser = function (userId, options = {}) {
    const whereClause = { userId };
    if (options.isActive !== undefined) {
        whereClause.isActive = options.isActive ? '1' : '0';
    }
    if (options.addressType) {
        whereClause.addressType = options.addressType;
    }
    if (options.addressFor) {
        whereClause.addressFor = options.addressFor;
    }

    return this.findAll({
        where: whereClause,
        order: [['isDefault', 'DESC'], ['createdOn', 'DESC']]
    });
};

Address.findDefaultAddress = function (userId, addressType = null) {
    const whereClause = { 
        userId, 
        isDefault: '1',
        isActive: '1'
    };
    
    if (addressType) {
        whereClause.addressType = addressType;
    }

    return this.findOne({ where: whereClause });
};

Address.findActiveAddresses = function (userId) {
    return this.findAll({
        where: { 
            userId,
            isActive: '1'
        },
        order: [['isDefault', 'DESC'], ['createdOn', 'DESC']]
    });
};

Address.findByLocation = function (latitude, longitude, radiusKm = 10) {
    // Simple distance calculation (for more accuracy, use specialized geo libraries)
    return this.findAll({
        where: {
            latitude: {
                [sequelize.Sequelize.Op.between]: [latitude - (radiusKm / 111), latitude + (radiusKm / 111)]
            },
            longitude: {
                [sequelize.Sequelize.Op.between]: [longitude - (radiusKm / 111), longitude + (radiusKm / 111)]
            },
            isActive: '1'
        }
    });
};

export default Address;