import { DataTypes } from 'sequelize';
import sequelize from '../db/index.js';

const AgentCategory = sequelize.define('AgentCategory', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  agentId: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    field: 'agent_id'
  },
  categoryId: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    field: 'category_id'
  },
  segment: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'agent_category',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['agent_id', 'category_id'] },
    { fields: ['agent_id'] },
    { fields: ['category_id'] }
  ]
});

AgentCategory.prototype.toJSON = function () {
  const values = { ...this.get() };
  return values;
};

export default AgentCategory;
