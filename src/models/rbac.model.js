/**
 * Sequelize Models for RBAC Tables (Optional)
 * 
 * These models allow you to interact with RBAC tables using Sequelize ORM
 * instead of raw SQL queries. This is optional - you can use either approach.
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/index.js';

// =====================================================
// Permission Model
// =====================================================

export const Permission = sequelize.define('Permission', {
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
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  isActive: {
    type: DataTypes.ENUM('0', '1'),
    allowNull: false,
    defaultValue: '1',
    field: 'is_active'
  },
  createdOn: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
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
    field: 'updated_on'
  },
  updatedBy: {
    type: DataTypes.INTEGER(11),
    allowNull: true,
    field: 'updated_by'
  }
}, {
  tableName: 'permissions',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['name']
    },
    {
      fields: ['category']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Class methods
Permission.findByName = function(name) {
  return this.findOne({ where: { name, isActive: '1' } });
};

Permission.findByCategory = function(category) {
  return this.findAll({ where: { category, isActive: '1' } });
};

Permission.findActive = function() {
  return this.findAll({ where: { isActive: '1' } });
};

// =====================================================
// Role Model
// =====================================================

export const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  displayName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'display_name'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.ENUM('0', '1'),
    allowNull: false,
    defaultValue: '1',
    field: 'is_active'
  },
  createdOn: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
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
    field: 'updated_on'
  },
  updatedBy: {
    type: DataTypes.INTEGER(11),
    allowNull: true,
    field: 'updated_by'
  }
}, {
  tableName: 'roles',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['name']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Class methods
Role.findByName = function(name) {
  return this.findOne({ where: { name, isActive: '1' } });
};

Role.findActive = function() {
  return this.findAll({ where: { isActive: '1' } });
};

// =====================================================
// RolePermission Model (Junction Table)
// =====================================================

export const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  roleId: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    field: 'role_id',
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  permissionId: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    field: 'permission_id',
    references: {
      model: 'permissions',
      key: 'id'
    }
  },
  grantedOn: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'granted_on'
  },
  grantedBy: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    field: 'granted_by'
  }
}, {
  tableName: 'role_permissions',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['role_id', 'permission_id']
    },
    {
      fields: ['role_id']
    },
    {
      fields: ['permission_id']
    }
  ]
});

// =====================================================
// UserPermission Model (User-specific overrides)
// =====================================================

export const UserPermission = sequelize.define('UserPermission', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
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
  permissionId: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    field: 'permission_id',
    references: {
      model: 'permissions',
      key: 'id'
    }
  },
  isGranted: {
    type: DataTypes.ENUM('0', '1'),
    allowNull: false,
    defaultValue: '1',
    field: 'is_granted'
  },
  grantedOn: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'granted_on'
  },
  grantedBy: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    field: 'granted_by'
  },
  expiresOn: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_on'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'user_permissions',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'permission_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['permission_id']
    },
    {
      fields: ['is_granted']
    },
    {
      fields: ['expires_on']
    }
  ]
});

// Instance methods
UserPermission.prototype.isExpired = function() {
  if (!this.expiresOn) {
    return false;
  }
  return new Date() > this.expiresOn;
};

UserPermission.prototype.isActivePermission = function() {
  return this.isGranted === '1' && !this.isExpired();
};

// Class methods
UserPermission.findActiveForUser = function(userId) {
  return this.findAll({
    where: {
      userId,
      isGranted: '1'
    },
    include: [
      {
        model: Permission,
        where: { isActive: '1' }
      }
    ]
  });
};

// =====================================================
// Associations
// =====================================================

// Role <-> Permission (Many-to-Many)
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions'
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles'
});

// User <-> Permission (Many-to-Many with extra fields)
// Note: Import User model from your existing user.model.js
import User from './user.model.js';

User.belongsToMany(Permission, {
  through: UserPermission,
  foreignKey: 'userId',
  otherKey: 'permissionId',
  as: 'specialPermissions'
});

Permission.belongsToMany(User, {
  through: UserPermission,
  foreignKey: 'permissionId',
  otherKey: 'userId',
  as: 'usersWithSpecialPermission'
});

// Direct associations for easier querying
RolePermission.belongsTo(Role, { foreignKey: 'roleId' });
RolePermission.belongsTo(Permission, { foreignKey: 'permissionId' });

UserPermission.belongsTo(User, { foreignKey: 'userId' });
UserPermission.belongsTo(Permission, { foreignKey: 'permissionId' });

// =====================================================
// Helper Functions
// =====================================================

/**
 * Get all effective permissions for a user (role + special permissions)
 * @param {number} userId - User ID
 * @returns {Promise<string[]>} - Array of permission names
 */
export const getUserEffectivePermissions = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    return [];
  }

  // Get role permissions
  const role = await Role.findByName(user.role);
  if (!role) {
    return [];
  }

  const rolePermissions = await role.getPermissions({
    where: { isActive: '1' }
  });

  // Get special user permissions (active and not expired)
  const userPermissions = await UserPermission.findAll({
    where: {
      userId,
      isGranted: '1'
    },
    include: [
      {
        model: Permission,
        where: { isActive: '1' }
      }
    ]
  });

  // Filter out expired permissions
  const activeUserPermissions = userPermissions
    .filter(up => !up.isExpired())
    .map(up => up.Permission);

  // Combine and deduplicate
  const allPermissions = [...rolePermissions, ...activeUserPermissions];
  const uniquePermissions = [...new Set(allPermissions.map(p => p.name))];

  return uniquePermissions;
};

/**
 * Check if user has a specific permission
 * @param {number} userId - User ID
 * @param {string} permissionName - Permission name
 * @returns {Promise<boolean>}
 */
export const userHasPermission = async (userId, permissionName) => {
  const permissions = await getUserEffectivePermissions(userId);
  return permissions.includes(permissionName);
};

/**
 * Grant special permission to user
 * @param {Object} params
 * @param {number} params.userId - User ID
 * @param {string} params.permissionName - Permission name
 * @param {number} params.grantedBy - Admin user ID
 * @param {Date} params.expiresOn - Expiration date (optional)
 * @param {string} params.reason - Reason for granting (optional)
 * @returns {Promise<UserPermission>}
 */
export const grantUserPermission = async ({ userId, permissionName, grantedBy, expiresOn, reason }) => {
  const permission = await Permission.findByName(permissionName);
  if (!permission) {
    throw new Error('Permission not found');
  }

  const [userPermission, created] = await UserPermission.findOrCreate({
    where: {
      userId,
      permissionId: permission.id
    },
    defaults: {
      isGranted: '1',
      grantedBy,
      expiresOn,
      reason
    }
  });

  if (!created) {
    // Update existing
    await userPermission.update({
      isGranted: '1',
      grantedOn: new Date(),
      grantedBy,
      expiresOn,
      reason
    });
  }

  return userPermission;
};

/**
 * Revoke special permission from user
 * @param {number} userId - User ID
 * @param {string} permissionName - Permission name
 * @returns {Promise<boolean>}
 */
export const revokeUserPermission = async (userId, permissionName) => {
  const permission = await Permission.findByName(permissionName);
  if (!permission) {
    return false;
  }

  const updated = await UserPermission.update(
    { isGranted: '0' },
    {
      where: {
        userId,
        permissionId: permission.id
      }
    }
  );

  return updated[0] > 0;
};

/**
 * Get all permissions for a role
 * @param {string} roleName - Role name (admin, agent, customer)
 * @returns {Promise<Permission[]>}
 */
export const getRolePermissions = async (roleName) => {
  const role = await Role.findByName(roleName);
  if (!role) {
    return [];
  }

  return await role.getPermissions({
    where: { isActive: '1' }
  });
};

/**
 * Assign permission to role
 * @param {string} roleName - Role name
 * @param {string} permissionName - Permission name
 * @param {number} grantedBy - Admin user ID
 * @returns {Promise<RolePermission>}
 */
export const assignPermissionToRole = async (roleName, permissionName, grantedBy) => {
  const role = await Role.findByName(roleName);
  if (!role) {
    throw new Error('Role not found');
  }

  const permission = await Permission.findByName(permissionName);
  if (!permission) {
    throw new Error('Permission not found');
  }

  const [rolePermission, created] = await RolePermission.findOrCreate({
    where: {
      roleId: role.id,
      permissionId: permission.id
    },
    defaults: {
      grantedBy
    }
  });

  return rolePermission;
};

/**
 * Remove permission from role
 * @param {string} roleName - Role name
 * @param {string} permissionName - Permission name
 * @returns {Promise<boolean>}
 */
export const removePermissionFromRole = async (roleName, permissionName) => {
  const role = await Role.findByName(roleName);
  if (!role) {
    return false;
  }

  const permission = await Permission.findByName(permissionName);
  if (!permission) {
    return false;
  }

  const deleted = await RolePermission.destroy({
    where: {
      roleId: role.id,
      permissionId: permission.id
    }
  });

  return deleted > 0;
};

// =====================================================
// Exports
// =====================================================

export default {
  Permission,
  Role,
  RolePermission,
  UserPermission,
  getUserEffectivePermissions,
  userHasPermission,
  grantUserPermission,
  revokeUserPermission,
  getRolePermissions,
  assignPermissionToRole,
  removePermissionFromRole
};
