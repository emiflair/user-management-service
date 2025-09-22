/**
 * Custom API Error Class
 * 
 * A custom error class that extends the native Error class to provide
 * HTTP status codes for API responses. This allows for consistent error
 * handling throughout the application with proper HTTP status codes.
 * 
 * Features:
 * - HTTP status code support
 * - Proper error stack trace capture
 * - Consistent error structure for API responses
 * - Integration with Express error handling middleware
 * 
 * @module utils/ApiError
 */

/**
 * API Error Class
 * 
 * Custom error class for API-specific errors that include HTTP status codes.
 * Extends the native JavaScript Error class to maintain compatibility with
 * standard error handling while adding HTTP status information.
 * 
 * @class ApiError
 * @extends Error
 * 
 * @param {number} statusCode - HTTP status code (e.g., 400, 401, 404, 500)
 * @param {string} message - Human-readable error message
 * 
 * @example
 * // Client errors (4xx)
 * throw new ApiError(400, 'Invalid input data');
 * throw new ApiError(401, 'Authentication required');
 * throw new ApiError(403, 'Insufficient permissions');
 * throw new ApiError(404, 'User not found');
 * throw new ApiError(409, 'Email already exists');
 * 
 * // Server errors (5xx)
 * throw new ApiError(500, 'Database connection failed');
 * 
 * @example
 * // In a service function
 * async function getUserById(id) {
 *   const user = await User.findById(id);
 *   if (!user) {
 *     throw new ApiError(404, 'User not found');
 *   }
 *   return user;
 * }
 */
class ApiError extends Error {
    constructor(statusCode, message) {
      super(message);
      
      /** @type {number} HTTP status code for the error */
      this.statusCode = statusCode;
      
      // Capture stack trace, excluding constructor call from it
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  module.exports = ApiError;
  