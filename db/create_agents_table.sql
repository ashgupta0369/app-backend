-- Create agents table for service application
CREATE TABLE agents (
    -- Primary Key
    agent_id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Identity & Contact Information
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    profile_picture VARCHAR(500) DEFAULT NULL,
    
    -- Professional Information
    license_number VARCHAR(50) UNIQUE,
    experience_years INT DEFAULT 0,
    specializations JSON, -- Store array of service categories
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    availability_status ENUM('available', 'busy', 'offline') DEFAULT 'offline',
    
    -- Business Details
    business_name VARCHAR(150) DEFAULT NULL,
    tax_id VARCHAR(50) DEFAULT NULL,
    insurance_details TEXT DEFAULT NULL,
    certifications JSON, -- Store array of certifications
    
    -- Location & Service Area
    current_latitude DECIMAL(10, 8) DEFAULT NULL,
    current_longitude DECIMAL(11, 8) DEFAULT NULL,
    service_radius INT DEFAULT 10, DEFAULT 5 -- in kilometers
    base_address TEXT DEFAULT NULL,
    city VARCHAR(100) DEFAULT NULL,
    state VARCHAR(100) DEFAULT NULL,
    zipcode VARCHAR(10) DEFAULT NULL,
    
    -- Platform Management
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    rating DECIMAL(3,2) DEFAULT 0.00, -- Average rating out of 5
    total_jobs_completed INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    background_check_status ENUM('pending', 'cleared', 'failed') DEFAULT 'pending',
    
    -- Additional Information
    bio TEXT DEFAULT NULL,
    documents JSON, -- Store uploaded document references
    emergency_contact_name VARCHAR(100) DEFAULT NULL,
    emergency_contact_phone VARCHAR(15) DEFAULT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_phone (phone),
    INDEX idx_email (email),
    INDEX idx_location (current_latitude, current_longitude),
    INDEX idx_verification_status (verification_status),
    INDEX idx_availability (availability_status),
    INDEX idx_city_state (city, state)
);

-- Create index for specializations (if using MySQL 8.0+ with JSON support)
-- CREATE INDEX idx_specializations ON agents ((CAST(specializations AS JSON ARRAY)));

-- Example of inserting sample data
-- INSERT INTO agents (
--     name, phone, email, password, license_number, experience_years, 
--     specializations, hourly_rate, business_name, base_address, city, state, zipcode
-- ) VALUES (
--     'John Smith', '+1234567890', 'john.smith@email.com', 'hashed_password_here',
--     'LIC123456', 5, '["plumbing", "electrical"]', 75.00,
--     'Smith Services LLC', '123 Main St', 'New York', 'NY', '10001'
-- );