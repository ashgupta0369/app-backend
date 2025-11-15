-- =====================================================
-- RBAC Database Migration
-- Creates tables for flexible permission management
-- =====================================================

-- Table: permissions
-- Stores all available permissions in the system
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT 'Permission identifier (e.g., user:create)',
  `description` TEXT NULL COMMENT 'Human-readable description of the permission',
  `category` VARCHAR(50) NULL COMMENT 'Permission category (e.g., user, agent, booking)',
  `is_active` ENUM('0', '1') NOT NULL DEFAULT '1' COMMENT '1 = Active, 0 = Inactive',
  `created_on` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) NOT NULL,
  `updated_on` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_permission_name` (`name`),
  KEY `idx_category` (`category`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores all system permissions';

-- Table: roles
-- Stores all available roles (can extend beyond user.role enum)
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT 'Role identifier (e.g., admin, agent, customer)',
  `display_name` VARCHAR(100) NOT NULL COMMENT 'Human-readable role name',
  `description` TEXT NULL COMMENT 'Role description',
  `is_active` ENUM('0', '1') NOT NULL DEFAULT '1' COMMENT '1 = Active, 0 = Inactive',
  `created_on` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) NOT NULL,
  `updated_on` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_name` (`name`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores all system roles';

-- Table: role_permissions
-- Maps permissions to roles (many-to-many relationship)
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `role_id` INT(11) NOT NULL,
  `permission_id` INT(11) NOT NULL,
  `granted_on` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `granted_by` INT(11) NOT NULL COMMENT 'User ID who granted this permission',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_permission` (`role_id`, `permission_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_id` (`permission_id`),
  CONSTRAINT `fk_role_permissions_role` 
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_role_permissions_permission` 
    FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Maps permissions to roles';

-- Table: user_permissions
-- Stores special permissions granted to specific users (overrides)
-- Useful for granting temporary or special permissions to individual users
CREATE TABLE IF NOT EXISTS `user_permissions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `permission_id` INT(11) NOT NULL,
  `is_granted` ENUM('0', '1') NOT NULL DEFAULT '1' COMMENT '1 = Granted, 0 = Revoked',
  `granted_on` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `granted_by` INT(11) NOT NULL COMMENT 'User ID who granted this permission',
  `expires_on` DATETIME NULL DEFAULT NULL COMMENT 'When this permission expires (NULL = never)',
  `reason` TEXT NULL COMMENT 'Reason for granting this special permission',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_permission` (`user_id`, `permission_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_permission_id` (`permission_id`),
  KEY `idx_is_granted` (`is_granted`),
  KEY `idx_expires_on` (`expires_on`),
  CONSTRAINT `fk_user_permissions_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_permissions_permission` 
    FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores special permissions for individual users';

-- =====================================================
-- Seed Data: Insert default roles
-- =====================================================

INSERT INTO `roles` (`id`, `name`, `display_name`, `description`, `created_by`) VALUES
(1, 'admin', 'Administrator', 'Full system access with all permissions', 1),
(2, 'agent', 'Service Agent', 'Service provider with limited access to manage bookings and profile', 1),
(3, 'customer', 'Customer', 'End user with access to book services and manage profile', 1)
ON DUPLICATE KEY UPDATE 
  `display_name` = VALUES(`display_name`),
  `description` = VALUES(`description`);

-- =====================================================
-- Seed Data: Insert default permissions
-- =====================================================

INSERT INTO `permissions` (`name`, `description`, `category`, `created_by`) VALUES
-- User Management Permissions
('user:create', 'Create new users', 'user', 1),
('user:read', 'View own user profile', 'user', 1),
('user:read:all', 'View all user profiles', 'user', 1),
('user:update', 'Update own user profile', 'user', 1),
('user:update:any', 'Update any user profile', 'user', 1),
('user:delete', 'Delete own user account', 'user', 1),
('user:delete:any', 'Delete any user account', 'user', 1),
('user:verify', 'Verify user email addresses', 'user', 1),
('user:activate', 'Activate user accounts', 'user', 1),
('user:deactivate', 'Deactivate user accounts', 'user', 1),

-- Agent Management Permissions
('agent:create', 'Create new agent accounts', 'agent', 1),
('agent:read', 'View own agent profile', 'agent', 1),
('agent:read:all', 'View all agent profiles', 'agent', 1),
('agent:update', 'Update own agent profile', 'agent', 1),
('agent:update:any', 'Update any agent profile', 'agent', 1),
('agent:delete', 'Delete own agent account', 'agent', 1),
('agent:delete:any', 'Delete any agent account', 'agent', 1),
('agent:verify', 'Verify agent documents', 'agent', 1),
('agent:approve', 'Approve agent applications', 'agent', 1),
('agent:reject', 'Reject agent applications', 'agent', 1),
('agent:activate', 'Activate agent accounts', 'agent', 1),
('agent:deactivate', 'Deactivate agent accounts', 'agent', 1),

-- Category Management Permissions
('category:create', 'Create service categories', 'category', 1),
('category:read', 'View service categories', 'category', 1),
('category:update', 'Update service categories', 'category', 1),
('category:delete', 'Delete service categories', 'category', 1),
('category:activate', 'Activate service categories', 'category', 1),
('category:deactivate', 'Deactivate service categories', 'category', 1),

-- Address Management Permissions
('address:create', 'Create addresses', 'address', 1),
('address:read', 'View own addresses', 'address', 1),
('address:read:all', 'View all addresses', 'address', 1),
('address:update', 'Update own addresses', 'address', 1),
('address:update:any', 'Update any address', 'address', 1),
('address:delete', 'Delete own addresses', 'address', 1),
('address:delete:any', 'Delete any address', 'address', 1),

-- Booking Management Permissions
('booking:create', 'Create bookings', 'booking', 1),
('booking:read', 'View own bookings', 'booking', 1),
('booking:read:all', 'View all bookings', 'booking', 1),
('booking:update', 'Update own bookings', 'booking', 1),
('booking:update:any', 'Update any booking', 'booking', 1),
('booking:delete', 'Delete own bookings', 'booking', 1),
('booking:delete:any', 'Delete any booking', 'booking', 1),
('booking:assign', 'Assign bookings to agents', 'booking', 1),
('booking:complete', 'Mark bookings as complete', 'booking', 1),
('booking:cancel', 'Cancel bookings', 'booking', 1),

-- Analytics & Reporting Permissions
('analytics:view', 'View analytics and reports', 'analytics', 1),
('analytics:export', 'Export analytics data', 'analytics', 1),

-- System Configuration Permissions
('system:config:read', 'View system configuration', 'system', 1),
('system:config:update', 'Update system configuration', 'system', 1),

-- File Management Permissions
('file:upload', 'Upload files', 'file', 1),
('file:delete', 'Delete own files', 'file', 1),
('file:delete:any', 'Delete any file', 'file', 1)
ON DUPLICATE KEY UPDATE 
  `description` = VALUES(`description`),
  `category` = VALUES(`category`);

-- =====================================================
-- Seed Data: Map permissions to roles
-- Note: This is a comprehensive mapping. Adjust based on your needs.
-- =====================================================

-- Get role IDs
SET @admin_role_id = (SELECT id FROM roles WHERE name = 'admin');
SET @agent_role_id = (SELECT id FROM roles WHERE name = 'agent');
SET @customer_role_id = (SELECT id FROM roles WHERE name = 'customer');

-- Admin gets all permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`, `granted_by`)
SELECT @admin_role_id, id, 1 FROM permissions
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Agent permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`, `granted_by`)
SELECT @agent_role_id, id, 1 FROM permissions WHERE name IN (
  'agent:read', 'agent:update',
  'category:read',
  'booking:read', 'booking:update', 'booking:complete',
  'file:upload', 'file:delete',
  'user:read'
)
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Customer permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`, `granted_by`)
SELECT @customer_role_id, id, 1 FROM permissions WHERE name IN (
  'user:read', 'user:update',
  'address:create', 'address:read', 'address:update', 'address:delete',
  'category:read',
  'agent:read', 'agent:read:all',
  'booking:create', 'booking:read', 'booking:update', 'booking:cancel',
  'file:upload', 'file:delete'
)
ON DUPLICATE KEY UPDATE role_id = role_id;

-- =====================================================
-- Indexes for performance optimization
-- =====================================================

-- Add composite indexes for common queries
ALTER TABLE `role_permissions` 
  ADD INDEX `idx_role_permission_lookup` (`role_id`, `permission_id`);

ALTER TABLE `user_permissions` 
  ADD INDEX `idx_user_permission_lookup` (`user_id`, `permission_id`, `is_granted`),
  ADD INDEX `idx_active_permissions` (`user_id`, `is_granted`, `expires_on`);

-- =====================================================
-- Views for easier permission checking
-- =====================================================

-- View: All effective permissions for each user (combines role and user permissions)
CREATE OR REPLACE VIEW `v_user_effective_permissions` AS
SELECT DISTINCT
  u.id AS user_id,
  u.name AS user_name,
  u.email AS user_email,
  u.role AS user_role,
  p.id AS permission_id,
  p.name AS permission_name,
  p.description AS permission_description,
  p.category AS permission_category,
  'role' AS permission_source
FROM users u
INNER JOIN roles r ON u.role = r.name
INNER JOIN role_permissions rp ON r.id = rp.role_id
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE u.is_active = '1' 
  AND r.is_active = '1'
  AND p.is_active = '1'

UNION

SELECT DISTINCT
  u.id AS user_id,
  u.name AS user_name,
  u.email AS user_email,
  u.role AS user_role,
  p.id AS permission_id,
  p.name AS permission_name,
  p.description AS permission_description,
  p.category AS permission_category,
  'user_override' AS permission_source
FROM users u
INNER JOIN user_permissions up ON u.id = up.user_id
INNER JOIN permissions p ON up.permission_id = p.id
WHERE u.is_active = '1'
  AND up.is_granted = '1'
  AND p.is_active = '1'
  AND (up.expires_on IS NULL OR up.expires_on > NOW());

-- =====================================================
-- Stored Procedures for permission management
-- =====================================================

DELIMITER $$

-- Procedure to check if user has permission
CREATE PROCEDURE IF NOT EXISTS `sp_check_user_permission`(
  IN p_user_id INT,
  IN p_permission_name VARCHAR(100),
  OUT p_has_permission BOOLEAN
)
BEGIN
  DECLARE v_count INT;
  
  SELECT COUNT(*) INTO v_count
  FROM v_user_effective_permissions
  WHERE user_id = p_user_id 
    AND permission_name = p_permission_name;
  
  SET p_has_permission = (v_count > 0);
END$$

-- Procedure to grant special permission to user
CREATE PROCEDURE IF NOT EXISTS `sp_grant_user_permission`(
  IN p_user_id INT,
  IN p_permission_name VARCHAR(100),
  IN p_granted_by INT,
  IN p_expires_on DATETIME,
  IN p_reason TEXT
)
BEGIN
  DECLARE v_permission_id INT;
  
  -- Get permission ID
  SELECT id INTO v_permission_id 
  FROM permissions 
  WHERE name = p_permission_name 
    AND is_active = '1';
  
  IF v_permission_id IS NULL THEN
    SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Permission not found or inactive';
  END IF;
  
  -- Grant permission
  INSERT INTO user_permissions (user_id, permission_id, is_granted, granted_by, expires_on, reason)
  VALUES (p_user_id, v_permission_id, '1', p_granted_by, p_expires_on, p_reason)
  ON DUPLICATE KEY UPDATE 
    is_granted = '1',
    granted_on = CURRENT_TIMESTAMP,
    granted_by = p_granted_by,
    expires_on = p_expires_on,
    reason = p_reason;
END$$

-- Procedure to revoke special permission from user
CREATE PROCEDURE IF NOT EXISTS `sp_revoke_user_permission`(
  IN p_user_id INT,
  IN p_permission_name VARCHAR(100)
)
BEGIN
  DECLARE v_permission_id INT;
  
  -- Get permission ID
  SELECT id INTO v_permission_id 
  FROM permissions 
  WHERE name = p_permission_name;
  
  IF v_permission_id IS NULL THEN
    SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Permission not found';
  END IF;
  
  -- Revoke permission
  UPDATE user_permissions 
  SET is_granted = '0'
  WHERE user_id = p_user_id 
    AND permission_id = v_permission_id;
END$$

DELIMITER ;

-- =====================================================
-- Cleanup expired permissions (run periodically via cron)
-- =====================================================

CREATE EVENT IF NOT EXISTS `evt_cleanup_expired_permissions`
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
  UPDATE user_permissions 
  SET is_granted = '0'
  WHERE expires_on IS NOT NULL 
    AND expires_on < NOW() 
    AND is_granted = '1';
