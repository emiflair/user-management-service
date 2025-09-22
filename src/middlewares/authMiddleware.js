/**
 * Authentication & Authorization Middleware
 * 
 * Provides JWT-based authentication and role-based authorization middleware
 * for protecting API endpoints. Supports both required and optional authentication
 * patterns, as well as flexible role-based access control.
 * 
 * Features:
 * - JWT token validation and parsing
 * - Flexible authentication (required vs optional)
 * - Role-based authorization with multiple role support
 * - Proper error handling with descriptive messages
 * - Request object augmentation with user data
 * 
 * @module middlewares/authMiddleware
 */

const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Authentication middleware factory
 * 
 * Creates middleware that validates JWT tokens from the Authorization header.
 * Supports both required and optional authentication modes for flexible
 * endpoint protection.
 * 
 * Token Format: "Bearer <jwt_token>"
 * 
 * On successful authentication, adds user object to req.user containing:
 * - id: User's MongoDB ObjectId
 * - role: User's role for authorization
 * 
 * @function auth
 * @param {boolean} [required=true] - Whether authentication is mandatory
 * @returns {Function} Express middleware function
 * 
 * @throws {ApiError} 401 - Authentication required (when required=true and no token)
 * @throws {ApiError} 401 - Invalid or expired token
 * 
 * @example
 * // Required authentication (default)
 * router.get('/profile', auth(), userController.me);
 * 
 * // Optional authentication
 * router.get('/public-data', auth(false), someController.getData);
 * 
 * // Inside controller, access authenticated user:
 * console.log(req.user.id);   // User's ID
 * console.log(req.user.role); // User's role
 */
function auth(required = true) {
  return (req, _res, next) => {
    // Extract Authorization header and parse Bearer token
    const header = req.header('Authorization');
    const token = header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;

    // Handle missing token based on requirement level
    if (!token) {
      if (required) return next(new ApiError(401, 'Authentication required'));
      req.user = null; // Set user to null for optional auth
      return next();
    }

    try {
      // Verify and decode JWT token
      const payload = jwt.verify(token, env.JWT_SECRET);
      
      // Add user information to request object for downstream use
      req.user = { 
        id: payload.sub,    // User ID from token subject
        role: payload.role  // User role for authorization
      };
      
      return next();
    } catch {
      // Token verification failed (invalid, expired, or malformed)
      return next(new ApiError(401, 'Invalid or expired token'));
    }
  };
}

/**
 * Authorization middleware factory
 * 
 * Creates middleware that enforces role-based access control (RBAC).
 * Must be used after authentication middleware as it depends on req.user.
 * Supports multiple roles for flexible permission management.
 * 
 * @function authorize
 * @param {...string} roles - List of allowed roles (student, instructor, admin)
 * @returns {Function} Express middleware function
 * 
 * @throws {ApiError} 401 - Authentication required (no req.user found)
 * @throws {ApiError} 403 - Insufficient permissions (role not in allowed list)
 * 
 * @example
 * // Single role authorization
 * router.delete('/users/:id', auth(), authorize('admin'), userController.remove);
 * 
 * // Multiple role authorization
 * router.get('/courses', auth(), authorize('instructor', 'admin'), courseController.list);
 * 
 * // Allow any authenticated user (no role restriction)
 * router.get('/profile', auth(), authorize(), userController.me);
 * 
 * @example
 * // Complete middleware chain example
 * router.post('/admin/users', 
 *   auth(),                    // 1. Authenticate user
 *   authorize('admin'),        // 2. Check admin role
 *   validate.createUserSchema, // 3. Validate input
 *   userController.create      // 4. Execute controller
 * );
 */
function authorize(...roles) {
  return (req, _res, next) => {
    // Ensure user is authenticated (req.user should be set by auth middleware)
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    
    // If roles are specified, check if user's role is included
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }
    
    // User is authorized, proceed to next middleware
    return next();
  };
}

/**
 * Module Exports
 * 
 * Exports authentication and authorization middleware functions for use
 * throughout the application's route definitions.
 */
module.exports = { 
  auth,      // Authentication middleware factory
  authorize  // Authorization middleware factory
};
