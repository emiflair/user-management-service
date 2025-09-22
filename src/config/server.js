/**
 * Express Server Configuration Module
 * 
 * This module initializes and configures the Express application with
 * security middleware, logging, body parsing, and rate limiting.
 * 
 * Security Features:
 * - Helmet: Sets various HTTP headers for security
 * - CORS: Configures cross-origin resource sharing
 * - Rate Limiting: Prevents abuse with request rate limits
 * - Mongo Sanitize: Prevents NoSQL injection attacks
 * - Body Size Limits: Prevents DoS attacks via large payloads
 * 
 * @module config/server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const { env, isProd } = require('./env');
const logger = require('../utils/logger');

/**
 * Initialize and configure Express application
 * 
 * Sets up all necessary middleware for security, logging, body parsing,
 * and request rate limiting. The configuration varies based on the
 * current environment (development vs production).
 * 
 * @function initServer
 * @returns {express.Application} Configured Express application instance
 */
const initServer = () => {
  const app = express();

  // Trust proxy headers (important for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);
  
  // Security middleware - sets various HTTP headers
  app.use(helmet());
  
  // Configure CORS with credentials support
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

  /**
   * HTTP Request Logging
   * 
   * Uses Morgan for HTTP request logging with different formats:
   * - Production: 'combined' format (more detailed)
   * - Development: 'dev' format (colored and concise)
   * 
   * Logs are forwarded to Winston logger for centralized logging
   */
  app.use(
    morgan(isProd ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );

  /**
   * Body Parsing Middleware
   * 
   * Configures body parsers with safe size limits to prevent DoS attacks:
   * - JSON parser: Limited to 10KB
   * - URL-encoded parser: Limited to 10KB with extended syntax support
   */
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  /**
   * Security: NoSQL Injection Protection
   * 
   * Sanitizes user input to prevent NoSQL injection attacks by
   * removing any keys that start with '$' or contain '.'
   */
  app.use(mongoSanitize());

  /**
   * Rate Limiting Configuration
   * 
   * Implements basic rate limiting to prevent abuse:
   * - Window: Configurable time window (default: 15 minutes)
   * - Max Requests: Configurable max requests per window (default: 300)
   * - Headers: Returns rate limit info in standard headers
   * - Legacy Headers: Disabled for cleaner response headers
   */
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS, // Time window in milliseconds
      max: env.RATE_LIMIT_MAX, // Maximum requests per window
      standardHeaders: true, // Include rate limit info in headers
      legacyHeaders: false, // Disable X-RateLimit-* headers
      message: 'Too many requests, please try again later.',
    })
  );

  return app;
};

module.exports = initServer;
