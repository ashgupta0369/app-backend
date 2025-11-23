CREATE TABLE `states` (
  `state_id` INT(11) NOT NULL AUTO_INCREMENT,
  `country_id` INT(11) DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(10) DEFAULT NULL COMMENT 'Short code or ISO code (optional)',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`state_id`),
  UNIQUE KEY `ux_states_country_name` (`country_id`,`name`),
  KEY `idx_states_country` (`country_id`),
  KEY `idx_states_code` (`code`),
  CONSTRAINT `fk_states_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;