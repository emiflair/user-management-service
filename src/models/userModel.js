/**
 * User Model
 * 
 * Defines the User schema for MongoDB using Mongoose, including validation,
 * password hashing, authentication methods, and security features.
 * 
 * Features:
 * - Automatic password hashing using bcrypt
 * - Email and username uniqueness validation
 * - Role-based access control (RBAC) support
 * - Account lockout protection via failed login tracking
 * - Automatic password exclusion from queries
 * - Timestamps for creation and updates
 * 
 * @module models/userModel
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { env } = require('../config/env');

/**
 * User Schema Definition
 * 
 * Defines the structure and validation rules for user documents in MongoDB.
 * Includes indexes for performance optimization and security constraints.
 * 
 * @typedef {Object} UserSchema
 * @property {string} username - Unique username (3-50 characters)
 * @property {string} email - Unique email address with format validation
 * @property {string} password - Hashed password (min 8 characters, excluded from queries)
 * @property {string} role - User role for RBAC (student, instructor, admin)
 * @property {boolean} isActive - Account status flag
 * @property {number} failedLoginAttempts - Counter for security lockout
 * @property {Date} lastLoginAt - Timestamp of last successful login
 * @property {Date} createdAt - Document creation timestamp (auto-generated)
 * @property {Date} updatedAt - Document update timestamp (auto-generated)
 */
const userSchema = new mongoose.Schema(
  {
    // Username with validation and indexing
    username: {
      type: String,
      required: true,
      trim: true, // Remove whitespace
      minlength: 3, // Minimum 3 characters
      maxlength: 50, // Maximum 50 characters
      unique: true, // Enforce uniqueness
      index: true, // Create database index for fast queries
    },
    
    // Email with validation, normalization, and indexing
    email: {
      type: String,
      required: true,
      trim: true, // Remove whitespace
      lowercase: true, // Convert to lowercase for consistency
      unique: true, // Enforce uniqueness
      index: true, // Create database index for fast queries
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Email format validation regex
    },
    
    // Password with security configurations
    password: {
      type: String,
      required: true,
      minlength: 8, // Minimum 8 characters for security
      select: false, // Never return password in queries by default
    },
    
    // Role-based access control
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'], // Allowed roles
      default: 'student', // Default role for new users
      index: true, // Index for role-based queries
    },
    
    // Account status management
    isActive: {
      type: Boolean,
      default: true, // New accounts are active by default
      index: true, // Index for filtering active/inactive users
    },
    
    // Security: Failed login attempt tracking
    failedLoginAttempts: {
      type: Number,
      default: 0, // Start with zero failed attempts
    },
    
    // User activity tracking
    lastLoginAt: {
      type: Date,
      // No default - set when user first logs in
    },
  },
  { 
    timestamps: true // Automatically add createdAt and updatedAt fields
  }
);

/**
 * Pre-save Middleware: Password Hashing
 * 
 * Automatically hashes the password before saving to the database if the password
 * field has been modified. Uses bcrypt with configurable salt rounds for security.
 * 
 * Security Features:
 * - Only hashes when password is modified (prevents re-hashing existing hashes)
 * - Uses configurable salt rounds from environment (default: 10)
 * - Async hashing to prevent blocking the event loop
 * 
 * @function
 * @param {Function} next - Mongoose middleware next function
 */
userSchema.pre('save', async function save(next) {
  // Skip hashing if password hasn't been modified
  if (!this.isModified('password')) return next();
  
  // Get salt rounds from environment or use default
  const saltRounds = Number(env.BCRYPT_SALT_ROUNDS) || 10;
  
  // Hash the password with the specified salt rounds
  this.password = await bcrypt.hash(this.password, saltRounds);
  
  return next();
});

/**
 * Instance Method: Password Comparison
 * 
 * Compares a plain text password with the hashed password stored in the database.
 * Used during authentication to verify user credentials.
 * 
 * @method comparePassword
 * @param {string} plain - Plain text password to compare
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 * 
 * @example
 * const user = await User.findOne({ email }).select('+password');
 * const isValid = await user.comparePassword('plainTextPassword');
 */
userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

/**
 * Instance Method: JSON Transformation
 * 
 * Customizes the JSON output when a user document is converted to JSON.
 * Removes sensitive fields (password) and mongoose internals (__v) for security.
 * 
 * Security Features:
 * - Removes password field from JSON output
 * - Removes mongoose version key (__v)
 * - Ensures sensitive data is never accidentally exposed in API responses
 * 
 * @method toJSON
 * @returns {Object} Sanitized user object without sensitive fields
 * 
 * @example
 * const user = await User.findById(userId);
 * res.json({ user }); // Password is automatically excluded
 */
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject({ versionKey: false }); // Remove __v field
  delete obj.password; // Remove password for security
  return obj;
};

/**
 * User Model Export
 * 
 * Creates and exports the User model from the schema.
 * This model provides the interface for interacting with the users collection
 * in MongoDB through Mongoose.
 * 
 * @type {mongoose.Model<UserSchema>}
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
