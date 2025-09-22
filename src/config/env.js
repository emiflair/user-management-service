/**
 * Environment Configuration Module
 * 
 * This module loads and validates environment variables using Joi schema validation.
 * It ensures that all required environment variables are present and properly formatted
 * before the application starts. If any validation fails, the application will exit
 * with an error message.
 * 
 * @module config/env
 */

// Load & validate environment variables
const path = require('path');
const dotenv = require('dotenv');
const Joi = require('joi');

// Load environment variables from .env file in the project root
dotenv.config({ path: path.join(process.cwd(), '.env') });

/**
 * Environment variables validation schema
 * 
 * Defines the expected environment variables with their types, validation rules,
 * and default values. This ensures the application has all necessary configuration
 * before startup.
 */
const schema = Joi.object({
  // Application environment (development, test, production)
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  
  // Server port number
  PORT: Joi.number().default(5000),
  
  // MongoDB connection string (required)
  MONGO_URI: Joi.string().uri({ scheme: ['mongodb', 'mongodb+srv'] }).required(),
  
  // JWT secret key for token signing (minimum 32 characters for security)
  JWT_SECRET: Joi.string().min(32).required(),
  
  // JWT token expiration time
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  
  // CORS allowed origins (* allows all origins)
  CORS_ORIGIN: Joi.string().allow('*').default('*'),
  
  // Rate limiting window in milliseconds (default: 15 minutes)
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
  
  // Maximum requests per window (default: 300 requests per 15 minutes)
  RATE_LIMIT_MAX: Joi.number().default(300),
  
  // Bcrypt salt rounds for password hashing (higher = more secure but slower)
  BCRYPT_SALT_ROUNDS: Joi.number().default(10),
}).unknown(); // Allow unknown environment variables

// Validate environment variables against the schema
const { value: env, error } = schema.validate(process.env);

// Exit the application if environment validation fails
if (error) {
  // Stop the app when env is invalid
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:', error.message);
  process.exit(1);
}

/**
 * Exported environment configuration
 * @typedef {Object} EnvironmentConfig
 * @property {Object} env - Validated environment variables
 * @property {boolean} isProd - Flag indicating if running in production mode
 */
module.exports = {
  env, // Validated and sanitized environment variables
  isProd: env.NODE_ENV === 'production', // Convenience flag for production checks
};
