/**
 * User Service
 * 
 * Business logic layer for user management operations. This service handles
 * all user-related business logic including authentication, authorization,
 * CRUD operations, and data validation. It acts as an intermediary between
 * the controllers and the data model.
 * 
 * Features:
 * - User registration and authentication
 * - JWT token generation and management
 * - Password security and validation
 * - User profile management
 * - Administrative user operations
 * - Input sanitization and validation
 * - Error handling and custom exceptions
 * 
 * @module services/userService
 */

const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Generate JWT token for authenticated user
 * 
 * Creates a signed JSON Web Token containing user information for authentication.
 * The token includes user ID and role for authorization purposes.
 * 
 * @function generateToken
 * @param {Object} payload - Token payload data
 * @param {string} payload.sub - User ID (subject)
 * @param {string} payload.role - User role for RBAC
 * @returns {string} Signed JWT token
 * 
 * @example
 * const token = generateToken({ sub: user.id, role: user.role });
 */
const generateToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

/**
 * Create a new user account
 * 
 * Registers a new user after validating that the email and username are unique.
 * The password will be automatically hashed before storage via the model's
 * pre-save middleware.
 * 
 * @async
 * @function createUser
 * @param {Object} data - User registration data
 * @param {string} data.username - Unique username (3-50 characters)
 * @param {string} data.email - Unique email address
 * @param {string} data.password - Plain text password (will be hashed)
 * @param {string} [data.role='student'] - User role
 * @returns {Promise<Object>} Created user object (without password)
 * 
 * @throws {ApiError} 409 - User with email or username already exists
 * @throws {ApiError} 400 - Validation errors from Mongoose schema
 * 
 * @example
 * const userData = {
 *   username: 'johndoe',
 *   email: 'john@example.com',
 *   password: 'securepass123',
 *   role: 'student'
 * };
 * const user = await createUser(userData);
 */
async function createUser(data) {
  // Check for existing user with same email or username
  const exists = await User.findOne({ $or: [{ email: data.email }, { username: data.username }] });
  if (exists) throw new ApiError(409, 'User with email or username already exists');
  
  // Create and save new user (password will be hashed automatically)
  const user = new User(data);
  await user.save();
  
  return user; // Password is excluded via toJSON method
}

/**
 * Authenticate user login
 * 
 * Verifies user credentials and returns user data with authentication token.
 * Updates login tracking information and resets failed login attempts on success.
 * Only active users can log in.
 * 
 * @async
 * @function login
 * @param {string} email - User's email address
 * @param {string} password - User's plain text password
 * @returns {Promise<Object>} Object containing user data and JWT token
 * @returns {Object} returns.user - User object (without password)
 * @returns {string} returns.token - JWT authentication token
 * 
 * @throws {ApiError} 401 - Invalid credentials or inactive account
 * 
 * @example
 * const { user, token } = await login('john@example.com', 'password123');
 * console.log(user.username); // 'johndoe'
 * console.log(token); // 'eyJhbGciOiJIUzI1NiIs...'
 */
async function login(email, password) {
  // Find active user with password field included
  const user = await User.findOne({ email, isActive: true }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid credentials');
  
  // Verify password using bcrypt comparison
  const ok = await user.comparePassword(password);
  if (!ok) throw new ApiError(401, 'Invalid credentials');
  
  // Update login tracking information
  user.lastLoginAt = new Date();
  user.failedLoginAttempts = 0; // Reset failed attempts on successful login
  await user.save();
  
  // Generate authentication token with user ID and role
  const token = generateToken({ sub: user.id, role: user.role });
  
  return { 
    user: user.toJSON(), // Exclude password and other sensitive fields
    token 
  };
}

/**
 * Get user by ID
 * 
 * Retrieves a user document by their MongoDB ObjectId.
 * Used for profile viewing and user data fetching.
 * 
 * @async
 * @function getUserById
 * @param {string} id - User's MongoDB ObjectId
 * @returns {Promise<Object>} User object (without password)
 * 
 * @throws {ApiError} 404 - User not found
 * 
 * @example
 * const user = await getUserById('60d5ecb54b24a63f5c7b1234');
 * console.log(user.email); // 'john@example.com'
 */
async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

/**
 * Update current user's profile
 * 
 * Allows users to update their own profile information with field restrictions
 * for security. Only whitelisted fields can be updated to prevent privilege
 * escalation or unauthorized field modifications.
 * 
 * @async
 * @function updateMe
 * @param {string} userId - User's MongoDB ObjectId
 * @param {Object} update - Update data object
 * @param {string} [update.username] - New username
 * @param {string} [update.email] - New email address
 * @returns {Promise<Object>} Updated user object (without password)
 * 
 * @throws {ApiError} 404 - User not found
 * @throws {ApiError} 409 - Username or email already exists (from unique constraints)
 * @throws {ApiError} 400 - Validation errors
 * 
 * @example
 * const updatedUser = await updateMe('60d5ecb54b24a63f5c7b1234', {
 *   username: 'newusername',
 *   email: 'newemail@example.com'
 * });
 */
async function updateMe(userId, update) {
  // Whitelist of allowed fields for security (prevents role/password updates)
  const allowed = ['username', 'email'];
  
  // Filter update object to only include allowed fields
  const payload = Object.fromEntries(
    Object.entries(update).filter(([k]) => allowed.includes(k))
  );
  
  // Update user with validation and return new document
  const user = await User.findByIdAndUpdate(userId, payload, { 
    new: true, // Return updated document
    runValidators: true // Run Mongoose schema validation
  });
  
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

/**
 * Change user password
 * 
 * Allows users to change their password by verifying their current password first.
 * The new password will be automatically hashed via the model's pre-save middleware.
 * 
 * @async
 * @function changePassword
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} currentPassword - User's current password for verification
 * @param {string} newPassword - New password (will be hashed automatically)
 * @returns {Promise<boolean>} True on successful password change
 * 
 * @throws {ApiError} 404 - User not found
 * @throws {ApiError} 400 - Current password is incorrect
 * 
 * @example
 * await changePassword('60d5ecb54b24a63f5c7b1234', 'oldpass123', 'newpass456');
 */
async function changePassword(userId, currentPassword, newPassword) {
  // Find user with password field included for verification
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ApiError(404, 'User not found');
  
  // Verify current password before allowing change
  const ok = await user.comparePassword(currentPassword);
  if (!ok) throw new ApiError(400, 'Current password is incorrect');
  
  // Set new password (will be hashed automatically by pre-save middleware)
  user.password = newPassword;
  await user.save();
  
  return true;
}

/**
 * List users with pagination and filtering (Admin function)
 * 
 * Returns a paginated list of users with optional role filtering and text search.
 * Supports searching across username and email fields with case-insensitive
 * regular expressions.
 * 
 * @async
 * @function listUsers
 * @param {Object} options - Query options for filtering and pagination
 * @param {number} [options.page=1] - Page number (1-based)
 * @param {number} [options.limit=10] - Number of users per page
 * @param {string} [options.role] - Filter by user role (student, instructor, admin)
 * @param {string} [options.search] - Search term for username/email
 * @returns {Promise<Object>} Paginated user list with metadata
 * @returns {Array} returns.items - Array of user objects
 * @returns {number} returns.page - Current page number
 * @returns {number} returns.limit - Users per page
 * @returns {number} returns.total - Total number of users matching criteria
 * @returns {number} returns.pages - Total number of pages
 * 
 * @example
 * const result = await listUsers({ page: 1, limit: 10, role: 'student', search: 'john' });
 * console.log(`Found ${result.total} users on ${result.pages} pages`);
 * result.items.forEach(user => console.log(user.username));
 */
async function listUsers({ page = 1, limit = 10, role, search }) {
  // Build query object based on filters
  const query = {};
  
  // Add role filter if specified
  if (role) query.role = role;
  
  // Add search filter if specified (case-insensitive across username and email)
  if (search) {
    query.$or = [
      { username: new RegExp(search, 'i') }, // Case-insensitive username search
      { email: new RegExp(search, 'i') },    // Case-insensitive email search
    ];
  }

  // Calculate pagination offset
  const skip = (page - 1) * limit;
  
  // Execute queries in parallel for performance
  const [items, total] = await Promise.all([
    User.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }), // Sort by newest first
    User.countDocuments(query), // Get total count for pagination
  ]);

  return {
    items,
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / limit) || 1, // Ensure at least 1 page
  };
}

/**
 * Delete a user account (Admin function)
 * 
 * Permanently removes a user from the database. This action cannot be undone.
 * Should be used with caution and proper authorization checks.
 * 
 * @async
 * @function deleteUser
 * @param {string} id - User's MongoDB ObjectId to delete
 * @returns {Promise<boolean>} True on successful deletion
 * 
 * @throws {ApiError} 404 - User not found
 * 
 * @example
 * await deleteUser('60d5ecb54b24a63f5c7b1234');
 * console.log('User deleted successfully');
 */
async function deleteUser(id) {
  const res = await User.findByIdAndDelete(id);
  if (!res) throw new ApiError(404, 'User not found');
  return true;
}

/**
 * Module Exports
 * 
 * Exports all user service functions for use by controllers and other modules.
 * These functions provide the complete business logic layer for user management.
 */
module.exports = {
  createUser,
  login,
  getUserById,
  updateMe,
  changePassword,
  listUsers,
  deleteUser,
  generateToken, // Utility function also available for external use
};
