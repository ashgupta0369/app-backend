/**
 * Database Migration Runner
 * 
 * Simple script to run SQL migration files
 * Usage: node scripts/migrate.js
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mechanics_db',
  multipleStatements: true // Important for running multiple SQL statements
};

/**
 * Run a SQL migration file
 */
async function runMigration(filePath) {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected');

    console.log(`📖 Reading migration file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log('🚀 Executing migration...');
    await connection.query(sql);
    console.log('✅ Migration completed successfully!');

    // Verify tables were created
    console.log('\n📋 Verifying RBAC tables...');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('permissions', 'roles', 'role_permissions', 'user_permissions')
    `, [dbConfig.database]);

    if (tables.length === 4) {
      console.log('✅ All RBAC tables created successfully:');
      tables.forEach(table => console.log(`   - ${table.TABLE_NAME}`));
    } else {
      console.log('⚠️  Warning: Some tables may not have been created');
      console.log(`   Expected 4 tables, found ${tables.length}`);
    }

    // Count permissions
    const [permCount] = await connection.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`\n📊 Permissions seeded: ${permCount[0].count}`);

    // Count roles
    const [roleCount] = await connection.query('SELECT COUNT(*) as count FROM roles');
    console.log(`📊 Roles seeded: ${roleCount[0].count}`);

    // Count role permissions
    const [rpCount] = await connection.query('SELECT COUNT(*) as count FROM role_permissions');
    console.log(`📊 Role-Permission mappings: ${rpCount[0].count}`);

    console.log('\n✨ RBAC system is ready to use!');
    console.log('\nNext steps:');
    console.log('1. Review the permissions in src/config/permissions.js');
    console.log('2. Check example routes in src/routes/examples.rbac.routes.js');
    console.log('3. Read RBAC_QUICK_START.md for usage guide');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your .env file has correct database credentials');
    console.error('2. Ensure the database exists');
    console.error('3. Verify MySQL is running');
    console.error('4. Check if you have necessary permissions');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   RBAC Database Migration Runner       ║');
  console.log('╚════════════════════════════════════════╝\n');

  const migrationFile = path.join(__dirname, '..', 'db', 'migrations', '001_create_rbac_tables.sql');

  // Check if migration file exists
  if (!fs.existsSync(migrationFile)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    process.exit(1);
  }

  console.log(`Database: ${dbConfig.database}`);
  console.log(`Host: ${dbConfig.host}`);
  console.log(`User: ${dbConfig.user}\n`);

  await runMigration(migrationFile);
}

// Run the migration
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
