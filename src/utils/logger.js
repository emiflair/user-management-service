/**
 * Application Logger Configuration
 * 
 * Centralized logging system using Winston library for structured logging
 * across the application. Provides console output for development and
 * file-based logging for production monitoring and debugging.
 * 
 * Features:
 * - JSON structured logging for easy parsing
 * - Console output for development
 * - File rotation to prevent disk space issues
 * - Error and combined log separation
 * - HTTP request logging support
 * - Automatic timestamping
 * - Error stack trace capture
 * 
 * @module utils/logger
 */

const { createLogger, format, transports } = require('winston');

/**
 * Winston Logger Instance
 * 
 * Configured logger with multiple output targets and structured formatting.
 * Uses JSON format for machine-readable logs and simple format for console output.
 * 
 * Log Levels (in order of severity):
 * - error: Error conditions that need immediate attention
 * - warn: Warning conditions that should be investigated
 * - info: Informational messages about application flow
 * - http: HTTP request/response logging
 * - debug: Debug information for development
 * 
 * Transport Configuration:
 * - Console: Simple format for development
 * - Error File: JSON format, errors only, 5MB max, 3 files retained
 * - Combined File: JSON format, all levels, 10MB max, 5 files retained
 */
const logger = createLogger({
  level: 'info', // Default logging level
  
  // Common format for all transports (except console override)
  format: format.combine(
    format.timestamp(), // Add timestamp to each log entry
    format.errors({ stack: true }), // Include stack traces for error objects
    format.json() // Structure logs as JSON for parsing
  ),
  
  // Output destinations
  transports: [
    // Console output for development (simple format for readability)
    new transports.Console({ 
      format: format.simple() 
    }),
    
    // Error-only file logging (5MB files, keep 3 rotations)
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error', 
      maxsize: 5_000_000,  // 5MB
      maxFiles: 3 
    }),
    
    // Combined logging for all levels (10MB files, keep 5 rotations)
    new transports.File({ 
      filename: 'logs/combined.log', 
      maxsize: 10_000_000, // 10MB
      maxFiles: 5 
    }),
  ],
});

/**
 * HTTP Logging Helper Method
 * 
 * Convenience method for logging HTTP requests and responses.
 * Used by Morgan middleware to integrate HTTP request logging
 * with the application's centralized logging system.
 * 
 * @method http
 * @param {string} msg - HTTP log message from Morgan
 * 
 * @example
 * // Used by Morgan middleware in server configuration
 * app.use(morgan('combined', {
 *   stream: { write: (msg) => logger.http(msg.trim()) }
 * }));
 */
logger.http = (msg) => logger.log({ level: 'http', message: msg });

/**
 * Logger Export
 * 
 * Exports the configured Winston logger instance for use throughout
 * the application. Provides methods for all log levels and HTTP logging.
 * 
 * @example
 * const logger = require('./utils/logger');
 * 
 * logger.info('Application started');
 * logger.warn('Configuration missing, using defaults');
 * logger.error('Database connection failed', { error: err });
 * logger.http('GET /api/users 200 45ms');
 */
module.exports = logger;
