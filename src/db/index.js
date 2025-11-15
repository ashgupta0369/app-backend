import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mechanics_app',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
};

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: dbConfig.define
  }
);

// Test database connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Sync database (create tables if they don't exist)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synchronized successfully.');
    }
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Initialize model relationships after all models are loaded
const initializeModels = async () => {
  try {
    // Import models dynamically to avoid circular dependencies
    const { default: User } = await import('../models/user.model.js');
    const { default: Category } = await import('../models/category.model.js');
    const { default: Address } = await import('../models/address.model.js');

    // User -> Category relationships
    User.hasMany(Category, {
      foreignKey: 'createdBy',
      as: 'createdCategories'
    });
    
    User.hasMany(Category, {
      foreignKey: 'updatedBy',
      as: 'updatedCategories'
    });

    Category.belongsTo(User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    Category.belongsTo(User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });

    // Category self-referencing relationships
    Category.hasMany(Category, {
      foreignKey: 'parentId',
      as: 'children'
    });

    Category.belongsTo(Category, {
      foreignKey: 'parentId',
      as: 'parent'
    });

    // User -> Address relationships
    User.hasMany(Address, {
      foreignKey: 'userId',
      as: 'addresses'
    });

    User.hasMany(Address, {
      foreignKey: 'createdBy',
      as: 'createdAddresses'
    });

    User.hasMany(Address, {
      foreignKey: 'updatedBy',
      as: 'updatedAddresses'
    });

    Address.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user'
    });

    Address.belongsTo(User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    Address.belongsTo(User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });

    console.log('✅ Model relationships initialized.');
  } catch (error) {
    console.error('❌ Error initializing model relationships:', error);
  }
};

// Close database connection
const disconnectDB = async () => {
  try {
    await sequelize.close();
    console.log('✅ Database connection closed successfully.');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

export { sequelize, connectDB, disconnectDB, initializeModels };
export default sequelize;
