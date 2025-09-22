/**
 * Error Handling Middleware Suite
 * 
 * Provides a comprehensive error handling system for Express applications,
 * including 404 handling, error normalization, and centralized error responses.
 * This module processes different types of errors and converts them into
 * consistent API responses.
 * 
 * Middleware Chain Order:
 * 1. Route handlers
 * 2. notFound (404 for unmatched routes)
 * 3. celebrateErrors (Celebrate/Joi validation errors)
 * 4. converter (Normalize all errors to ApiError format)
 * 5. handler (Generate final error response)
 * 
 * @module utils/errorHandler
 */

const { isCelebrateError, errors: celebrateErrors } = require('celebrate');
const ApiError = require('./ApiError');
const logger = require('./logger');
const { isProd } = require('../config/env');

/**
 * 404 Not Found Middleware
 * 
 * Catches all requests that don't match any defined routes and creates
 * a standardized 404 error. Should be placed after all route definitions
 * but before other error handling middleware.
 * 
 * @function notFound
 * @param {Object} req - Express request object
 * @param {Object} _res - Express response object (unused)
 * @param {Function} next - Express next function
 * 
 * @example
 * // In app.js, after all routes
 * app.use('/api/users', userRoutes);
 * app.use(notFound); // Catches unmatched routes
 */
const notFound = (req, _res, next) => 
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));

/**
 * Error Converter Middleware
 * 
 * Normalizes different types of errors into standardized ApiError instances.
 * Handles special cases like Celebrate validation errors and generic errors,
 * ensuring all errors have consistent structure and appropriate status codes.
 * 
 * Error Types Handled:
 * - Celebrate/Joi validation errors → 400 Bad Request
 * - Generic errors with statusCode → Preserve status
 * - Unknown errors → 500 Internal Server Error
 * - Already ApiError instances → Pass through unchanged
 * 
 * @function converter
 * @param {Error} err - Error object to convert
 * @param {Object} _req - Express request object (unused)
 * @param {Object} _res - Express response object (unused)
 * @param {Function} next - Express next function
 * 
 * @example
 * // Celebrate validation error becomes:
 * // CelebrateError → ApiError(400, "Username is required")
 * 
 * // Generic error becomes:
 * // Error("Something failed") → ApiError(500, "Something failed")
 */
const converter = (err, _req, _res, next) => {
  // Handle Celebrate (Joi) validation errors
  if (isCelebrateError(err)) {
    // Extract the first validation error message from the error details
    const details = [...err.details.values()][0].details?.[0];
    const message = details?.message || 'Validation error';
    return next(new ApiError(400, message));
  }
  
  // Convert generic errors to ApiError format
  if (!(err instanceof ApiError)) {
    const status = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    return next(new ApiError(status, message));
  }
  
  // Already an ApiError, pass through unchanged
  return next(err);
};

/**
 * Final Error Handler Middleware
 * 
 * Generates the final HTTP response for all errors. Formats errors consistently
 * and includes additional debugging information in non-production environments.
 * Also handles logging of errors based on severity level.
 * 
 * Response Format:
 * - status: HTTP status code
 * - message: Human-readable error message
 * - stack: Error stack trace (development only)
 * 
 * Logging Strategy:
 * - 5xx errors: Logged as errors (server issues)
 * - 4xx errors: Logged as warnings (client issues)
 * 
 * @function handler
 * @param {ApiError} err - Error object (should be ApiError by this point)
 * @param {Object} _req - Express request object (unused)
 * @param {Object} res - Express response object
 * @param {Function} _next - Express next function (unused)
 * 
 * @example
 * // Production response
 * {
 *   "status": 404,
 *   "message": "User not found"
 * }
 * 
 * // Development response (includes stack trace)
 * {
 *   "status": 404,
 *   "message": "User not found",
 *   "stack": "Error: User not found\n    at getUserById..."
 * }
 */
const handler = (err, _req, res, _next) => {
  const status = err.statusCode || 500;
  
  // Build response payload
  const payload = {
    status,
    message: err.message || 'Internal Server Error',
  };
  
  // Include stack trace in development for debugging
  if (!isProd) {
    payload.stack = err.stack;
  }

  // Log errors based on severity
  if (status >= 500) {
    logger.error(err); // Server errors - log full error object
  } else {
    logger.warn(err.message); // Client errors - log message only
  }

  // Send error response
  res.status(status).json(payload);
};

/**
 * Module Exports
 * 
 * Exports all error handling middleware in the correct order for application setup.
 * 
 * Setup Order in Express App:
 * 1. Define all routes first
 * 2. app.use(celebrateErrors()) - Handle Celebrate validation errors
 * 3. app.use(notFound) - Handle 404 errors
 * 4. app.use(converter) - Convert errors to ApiError format
 * 5. app.use(handler) - Generate final error responses
 * 
 * @example
 * const { notFound, converter, handler, celebrateErrors } = require('./utils/errorHandler');
 * 
 * // After all routes
 * app.use(celebrateErrors()); // Must be first to catch Celebrate errors
 * app.use(notFound);          // Catch unmatched routes
 * app.use(converter);         // Normalize all errors
 * app.use(handler);           // Generate responses
 */
module.exports = { 
  notFound,        // 404 error middleware
  converter,       // Error normalization middleware
  handler,         // Final error response middleware
  celebrateErrors  // Celebrate validation error middleware (from celebrate library)
};
