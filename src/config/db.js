/**
 * Database Configuration Module
 * 
 * This module handles MongoDB connection setup using Mongoose.
 * It includes connection options, error handling, and graceful shutdown logic.
 * 
 * @module config/db
 */

const mongoose = require('mongoose');
const { env } = require('./env');
const logger = require('../utils/logger');

// Configure Mongoose to use strict query mode for better performance and security
mongoose.set('strictQuery', true);

/**
 * Establishes connection to MongoDB database
 * 
 * Uses environment configuration for connection string and sets up
 * appropriate connection options for different environments.
 * 
 * Connection Options:
 * - serverSelectionTimeoutMS: How long to wait for server selection
 * - autoIndex: Automatically create indexes (disabled in production for performance)
 * 
 * @async
 * @function connectDB
 * @throws {Error} Exits process with code 1 if connection fails
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout for server selection
      autoIndex: !process.env.NODE_ENV === 'production', // Disable auto-indexing in production
    });
    logger.info('✅ MongoDB connected');
  } catch (err) {
    logger.error('❌ MongoDB connection failed', { err });
    process.exit(1); // Exit process if database connection fails
  }
};

/**
 * Database Event Handlers
 * 
 * Set up event listeners for MongoDB connection events to handle
 * errors and disconnections gracefully.
 */

// Log database errors
mongoose.connection.on('error', (err) => logger.error('Mongo error', { err }));

// Log when database disconnects
mongoose.connection.on('disconnected', () => logger.warn('Mongo disconnected'));

module.exports = connectDB;
