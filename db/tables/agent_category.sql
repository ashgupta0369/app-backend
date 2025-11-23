CREATE TABLE `agent_category` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `agent_id` INT(11) NOT NULL,
  `category_id` INT(11) NOT NULL,
  `segment` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_agent_category` (`agent_id`,`category_id`),
  KEY `idx_agent_category_agent` (`agent_id`),
  KEY `idx_agent_category_category` (`category_id`),
  CONSTRAINT `fk_agent_category_agent` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`agent_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_agent_category_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
