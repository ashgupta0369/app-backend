import sequelize from './index.js';
import { QueryTypes } from 'sequelize';

// Raw SQL query execution using Sequelize
export const executeQuery = async (query, replacements = []) => {
  try {
    const results = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Transaction wrapper
export const executeTransaction = async (callback) => {
  const transaction = await sequelize.transaction();
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Generic CRUD operations
export const dbOperations = {
  // Find records with optional conditions
  find: async (table, conditions = {}, orderBy = null, limit = null) => {
    let query = `SELECT * FROM ${table}`;
    const params = [];
    
    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = ?`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    
    return await executeQuery(query, params);
  },

  // Find a single record by ID
  findById: async (table, id, idColumn = 'id') => {
    const query = `SELECT * FROM ${table} WHERE ${idColumn} = ? LIMIT 1`;
    const results = await executeQuery(query, [id]);
    return results[0] || null;
  },

  // Insert a new record
  create: async (table, data) => {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    return await executeQuery(query, values);
  },

  // Update a record by ID
  update: async (table, id, data, idColumn = 'id') => {
    const setClause = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(data), id];
    
    const query = `UPDATE ${table} SET ${setClause} WHERE ${idColumn} = ?`;
    return await executeQuery(query, values);
  },

  // Delete a record by ID
  delete: async (table, id, idColumn = 'id') => {
    const query = `DELETE FROM ${table} WHERE ${idColumn} = ?`;
    return await executeQuery(query, [id]);
  },

  // Count records with optional conditions
  count: async (table, conditions = {}) => {
    let query = `SELECT COUNT(*) as count FROM ${table}`;
    const params = [];
    
    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = ?`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }
    
    const result = await executeQuery(query, params);
    return result[0].count;
  },

  // Check if a record exists
  exists: async (table, conditions) => {
    const count = await dbOperations.count(table, conditions);
    return count > 0;
  }
};

// Example usage functions for common patterns
export const userQueries = {
  // Find user by email
  findByEmail: async (email) => {
    const query = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    const results = await executeQuery(query, [email]);
    return results[0] || null;
  },

  // Create user with hashed password
  createUser: async (userData) => {
    const query = `
      INSERT INTO users (name, email, password, phone, role, created_at) 
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    return await executeQuery(query, [
      userData.name,
      userData.email,
      userData.password,
      userData.phone,
      userData.role || 'user'
    ]);
  }
};