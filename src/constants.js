// Database Constants
export const DB_CONSTANTS = {
  MAX_POOL_SIZE: 10,
  MIN_POOL_SIZE: 0,
  ACQUIRE_TIMEOUT: 30000,
  IDLE_TIMEOUT: 10000
};

// Application Constants
export const APP_CONSTANTS = {
  DEFAULT_PORT: 3000,
  JWT_EXPIRES_IN: '7d'
};

// User Role Constants
export const USER_ROLES = {
  ADMIN: 'admin',
  SERVICE_PROVIDER: 'agent',
  CUSTOMER: 'customer'
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

export const STATUS_CODES = {
  SUCCESS: 'Success',
  ERROR: 'Error'
};

export const USER_MESSAGES = {
  ACTIVE: 'User is active',
  INACTIVE: 'User is inactive',
  SUSPENDED: 'User is suspended',
  NOT_FOUND: 'User not found',
  CREATED: 'User created successfully',
  UPDATED: 'User updated successfully',
  DELETED: 'User deleted successfully',
  LOGIN_SUCCESS: 'User logged in successfully',
  LOGIN_FAILED: 'User login failed',
  LOGOUT_SUCCESS: 'User logged out successfully',
  LOGOUT_FAILED: 'User logout failed',
  PROFILE_RETRIEVED: 'User profile retrieved successfully',
  PROFILE_UPDATED: 'User profile updated successfully',
  PROFILE_UPDATE_FAILED: 'User profile update failed',
  EMAIL_EXISTS: 'User with this email already exists',
  USERNAME_EXISTS: 'User with this username already exists',
  REGISTRATION_SUCCESS: 'User registered successfully. Please check your email for verification code.',
  REGISTRATION_FAILED: 'User registration failed',
  EMAIL_SENT: 'Email sent successfully',
  EMAIL_NOT_VERIFIED: 'Email not verified, please verify your email',
  EMAIL_VERIFIED: 'Email verified successfully',
  PASSWORD_RESET: 'Password reset successfully',
  PASSWORD_RESET_FAILED: 'Password reset failed',
  INVALID_CREDENTIALS: 'Invalid credentials provided',
  ADDRESS_ADDED: 'Address added successfully',
  ADDRESS_UPDATED: 'Address updated successfully',
  ADDRESS_DELETED: 'Address deleted successfully',
  ADDRESS_NOT_FOUND: 'Address not found',
  ADDRESS_FOUND_SUCCESS: 'Address found successfully',
};

export const CATEGORY_MESSAGES = {
  ACTIVE: 'Service is active',
  INACTIVE: 'Service is inactive',
  SUSPENDED: 'Service is suspended',
  NOT_FOUND: 'Service not found',
  CREATED: 'Service created successfully',
  UPDATED: 'Service updated successfully',
  DELETED: 'Service deleted successfully',
  FOUND_SUCCESS: 'Service found successfully'
}

export const GENERAL_MESSAGES = {
  SERVER_ERROR: 'Internal server error',
  NOT_AUTHORIZED: 'User not authorized',
  FORBIDDEN: 'Access forbidden',
  BAD_REQUEST: 'Bad request',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource conflict',
  UNPROCESSABLE_ENTITY: 'Unprocessable entity',
  SOMETHING: 'Something went wrong',
  OTP_SENT: 'OTP sent successfully',
  OTP_VERIFIED: 'OTP verified successfully',
  OTP_INVALID: 'Invalid OTP provided'
};

// Agent-specific messages
export const AGENT_MESSAGES = {
    REGISTRATION_SUCCESS: 'Agent registered successfully. Your account is pending verification.',
    LOGIN_SUCCESS: 'Agent logged in successfully',
    PROFILE_RETRIEVED: 'Agent profile retrieved successfully',
    PROFILE_UPDATED: 'Agent profile updated successfully',
    LOGOUT_SUCCESS: 'Agent logged out successfully',
    EMAIL_EXISTS: 'An agent with this email already exists',
    PHONE_EXISTS: 'An agent with this phone number already exists',
    LICENSE_EXISTS: 'An agent with this license number already exists',
    NOT_FOUND: 'Agent not found',
    ACCOUNT_PENDING: 'Your account is pending verification',
    ACCOUNT_REJECTED: 'Your account verification was rejected. Please contact support.',
    ACCOUNT_INACTIVE: 'Your account has been deactivated. Please contact support.',
    LOCATION_UPDATED: 'Location updated successfully',
    AVAILABILITY_UPDATED: 'Availability status updated successfully',
    SPECIALIZATION_ADDED: 'Specialization added successfully',
    SPECIALIZATION_REMOVED: 'Specialization removed successfully'
};

// RBAC (Role-Based Access Control) Messages
export const RBAC_MESSAGES = {
    PERMISSION_DENIED: 'You do not have permission to perform this action',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
    ADMIN_ACCESS_REQUIRED: 'Administrator access required',
    ROLE_REQUIRED: 'Specific role required for this action',
    OWNERSHIP_REQUIRED: 'You can only access your own resources',
    PERMISSION_GRANTED: 'Permission granted successfully',
    PERMISSION_REVOKED: 'Permission revoked successfully',
    INVALID_PERMISSION: 'Invalid permission specified',
    INVALID_ROLE: 'Invalid role specified'
};