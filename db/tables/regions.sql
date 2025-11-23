CREATE TABLE `regions` (
  `region_id` INT(11) NOT NULL AUTO_INCREMENT,
  `country_id` INT(11) DEFAULT NULL,
  `state_id` INT(11) DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(10) DEFAULT NULL COMMENT 'Short code (optional)',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`region_id`),
  UNIQUE KEY `ux_regions_country_state_name` (`country_id`,`state_id`,`name`),
  KEY `idx_regions_country` (`country_id`),
  KEY `idx_regions_state` (`state_id`),
  KEY `idx_regions_code` (`code`),
  CONSTRAINT `fk_regions_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_regions_state` FOREIGN KEY (`state_id`) REFERENCES `states` (`state_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;