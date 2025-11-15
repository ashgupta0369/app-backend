import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            len: [2, 100],
            notEmpty: true
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
    },
    slug: {
        type: DataTypes.STRING(120),
        allowNull: true,
        unique: true,
        validate: {
            len: [2, 120]
        }
    },
    parentId: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        defaultValue: null,
        field: 'parent_id',
        references: {
            model: 'category',
            key: 'id'
        }
    },
    imageUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
        field: 'image_url',
        validate: {
            // Custom validation to allow both file paths and URLs
            isValidImagePath(value) {
                if (value === null || value === undefined || value === '') {
                    return; // Allow null/empty values
                }
                
                // Allow file paths (starting with uploads/) or full URLs
                const isFilePath = /^uploads\//.test(value);
                const isUrl = /^https?:\/\//.test(value);
                
                if (!isFilePath && !isUrl) {
                    throw new Error('Image must be a valid file path (starting with uploads/) or a full URL');
                }
            }
        }
    },
    isActive: {
        type: DataTypes.ENUM('0', '1'),
        allowNull: false,
        defaultValue: '1',
        field: 'is_active',
        comment: '1 = Active, 0 = Inactive'
    },
    sortOrder: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        defaultValue: 0,
        field: 'sort_order',
        comment: 'For ordering categories'
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
    tableName: 'category',
    timestamps: false, // Using custom timestamp fields
    indexes: [
        {
            unique: true,
            fields: ['name']
        },
        {
            unique: true,
            fields: ['slug']
        },
        {
            fields: ['parent_id']
        },
        {
            fields: ['is_active']
        },
        {
            fields: ['sort_order']
        }
    ],
    hooks: {
        beforeCreate: async (category) => {
            // Set created_on timestamp
            category.createdOn = new Date();

            // Generate slug from name if not provided
            if (!category.slug && category.name) {
                category.slug = category.name
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
                    .replace(/\s+/g, '-') // Replace spaces with hyphens
                    .replace(/-+/g, '-') // Replace multiple hyphens with single
                    .trim('-'); // Remove leading/trailing hyphens
            }
        },
        beforeUpdate: async (category) => {
            // Set updated_on timestamp
            category.updatedOn = new Date();

            // Update slug if name changed
            if (category.changed('name') && category.name) {
                category.slug = category.name
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim('-');
            }
        }
    }
});

// Instance methods
Category.prototype.toJSON = function () {
    const values = { ...this.get() };
    return values;
};

// Helper methods for status
Category.prototype.isActiveCategory = function () {
    return this.isActive === '1';
};

Category.prototype.activate = async function () {
    return await this.update({ isActive: '1' });
};

Category.prototype.deactivate = async function () {
    return await this.update({ isActive: '0' });
};

// Check if category has children
Category.prototype.hasChildren = async function () {
    const children = await Category.findAll({
        where: { parentId: this.id }
    });
    return children.length > 0;
};

// Get all children categories
Category.prototype.getChildren = async function () {
    return await Category.findAll({
        where: { parentId: this.id },
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });
};

// Class methods
Category.findBySlug = function (slug) {
    return this.findOne({ where: { slug } });
};

Category.findByName = function (name) {
    return this.findOne({ where: { name } });
};

Category.findActiveCategories = function () {
    return this.findAll({
        where: { isActive: '1' },
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });
};

Category.findRootCategories = function () {
    return this.findAll({
        where: { parentId: null },
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });
};

Category.findByParent = function (parentId) {
    return this.findAll({
        where: { parentId },
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });
};

export default Category;