/**
 * Request Validation Middleware
 * 
 * Provides Joi-based validation schemas for all API endpoints using the Celebrate
 * library. Each schema validates specific request segments (body, query, params)
 * and returns detailed validation errors to help developers and users understand
 * what data is expected.
 * 
 * Features:
 * - Comprehensive input validation for all endpoints
 * - Detailed error messages for better debugging
 * - Type coercion and sanitization
 * - Custom validation rules for MongoDB ObjectIds
 * - Abort early disabled for complete error reporting
 * 
 * @module middlewares/validate
 */

const { celebrate, Segments, Joi } = require('celebrate');

/**
 * User Registration Validation Schema
 * 
 * Validates user registration request body with comprehensive rules
 * for username, email, password, and optional role assignment.
 * 
 * @constant {Function} registerSchema
 * 
 * Required Fields:
 * - username: 3-50 characters, alphanumeric
 * - email: Valid email format
 * - password: Minimum 8 characters
 * 
 * Optional Fields:
 * - role: Must be 'student', 'instructor', or 'admin'
 * 
 * @example
 * router.post('/register', registerSchema, userController.register);
 */
const registerSchema = celebrate({
  [Segments.BODY]: Joi.object({
    username: Joi.string().min(3).max(50).required()
      .messages({
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 50 characters',
        'any.required': 'Username is required'
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string().min(8).required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'any.required': 'Password is required'
      }),
    role: Joi.string().valid('student', 'instructor', 'admin').optional()
      .messages({
        'any.only': 'Role must be either student, instructor, or admin'
      }),
  }),
}, { abortEarly: false }); // Return all validation errors, not just the first one

/**
 * User Login Validation Schema
 * 
 * Validates user login request body ensuring proper email format
 * and password presence for authentication.
 * 
 * @constant {Function} loginSchema
 * 
 * @example
 * router.post('/login', loginSchema, userController.login);
 */
const loginSchema = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string().required()
      .messages({
        'any.required': 'Password is required'
      }),
  }),
}, { abortEarly: false });

/**
 * Profile Update Validation Schema
 * 
 * Validates user profile update requests. At least one field must be provided
 * for the update to be valid. Only username and email can be updated for security.
 * 
 * @constant {Function} updateMeSchema
 * 
 * Optional Fields (at least one required):
 * - username: 3-50 characters
 * - email: Valid email format
 * 
 * @example
 * router.put('/me', auth(), updateMeSchema, userController.updateMe);
 */
const updateMeSchema = celebrate({
  [Segments.BODY]: Joi.object({
    username: Joi.string().min(3).max(50)
      .messages({
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 50 characters'
      }),
    email: Joi.string().email()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
  }).min(1) // At least one field must be provided
    .messages({
      'object.min': 'At least one field (username or email) must be provided'
    }),
}, { abortEarly: false });

/**
 * Password Change Validation Schema
 * 
 * Validates password change requests ensuring both current password
 * for verification and new password with security requirements.
 * 
 * @constant {Function} changePasswordSchema
 * 
 * Required Fields:
 * - currentPassword: User's existing password for verification
 * - newPassword: New password (minimum 8 characters)
 * 
 * @example
 * router.post('/change-password', auth(), changePasswordSchema, userController.changePassword);
 */
const changePasswordSchema = celebrate({
  [Segments.BODY]: Joi.object({
    currentPassword: Joi.string().required()
      .messages({
        'any.required': 'Current password is required'
      }),
    newPassword: Joi.string().min(8).required()
      .messages({
        'string.min': 'New password must be at least 8 characters long',
        'any.required': 'New password is required'
      }),
  }),
}, { abortEarly: false });

/**
 * User List Query Validation Schema
 * 
 * Validates query parameters for user listing endpoint with pagination,
 * filtering, and search capabilities. Provides sensible defaults and limits.
 * 
 * @constant {Function} listUsersSchema
 * 
 * Optional Query Parameters:
 * - page: Page number (minimum 1, default 1)
 * - limit: Items per page (1-100, default 10)
 * - role: Filter by role (student, instructor, admin)
 * - search: Search term for username/email
 * 
 * @example
 * router.get('/', auth(), authorize('admin'), listUsersSchema, userController.list);
 */
const listUsersSchema = celebrate({
  [Segments.QUERY]: Joi.object({
    page: Joi.number().min(1).default(1)
      .messages({
        'number.min': 'Page number must be at least 1'
      }),
    limit: Joi.number().min(1).max(100).default(10)
      .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100 items per page'
      }),
    role: Joi.string().valid('student', 'instructor', 'admin')
      .messages({
        'any.only': 'Role filter must be either student, instructor, or admin'
      }),
    search: Joi.string()
      .messages({
        'string.base': 'Search term must be a string'
      }),
  }),
}, { abortEarly: false });

/**
 * MongoDB ObjectId Validation Schema
 * 
 * Validates route parameters that should be valid MongoDB ObjectIds.
 * Ensures the ID parameter is a 24-character hexadecimal string.
 * 
 * @constant {Function} objectIdSchema
 * 
 * Required Parameters:
 * - id: Valid MongoDB ObjectId (24-character hex string)
 * 
 * @example
 * router.delete('/:id', auth(), authorize('admin'), objectIdSchema, userController.remove);
 */
const objectIdSchema = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().hex().length(24).required()
      .messages({
        'string.hex': 'ID must be a valid hexadecimal string',
        'string.length': 'ID must be exactly 24 characters long',
        'any.required': 'ID parameter is required'
      }),
  }),
});

/**
 * Module Exports
 * 
 * Exports all validation schemas for use in route definitions.
 * Each schema is pre-configured with appropriate validation rules
 * and error messages for better developer experience.
 * 
 * @example
 * const { registerSchema, loginSchema } = require('./middlewares/validate');
 * 
 * router.post('/register', registerSchema, userController.register);
 * router.post('/login', loginSchema, userController.login);
 */
module.exports = {
  registerSchema,      // User registration validation
  loginSchema,         // User login validation (lowercase to match routes)
  updateMeSchema,      // Profile update validation
  changePasswordSchema, // Password change validation
  listUsersSchema,     // User listing query validation
  objectIdSchema,      // MongoDB ObjectId parameter validation
};
