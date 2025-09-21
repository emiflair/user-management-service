const User = require('../models/userModel');
const logger = require('../utils/logger');

class UserService {
  /**
   * Get users with pagination and filtering
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Pagination options
   * @returns {Object} Users data with pagination info
   */
  async getUsers(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find(filters)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(filters)
      ]);

      return {
        users,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error(`Error in UserService.getUsers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Object} User data
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      return user;
    } catch (error) {
      logger.error(`Error in UserService.getUserById: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @param {boolean} includePassword - Whether to include password in result
   * @returns {Object} User data
   */
  async getUserByEmail(email, includePassword = false) {
    try {
      let query = User.findOne({ email: email.toLowerCase() });
      
      if (includePassword) {
        query = query.select('+password');
      }
      
      const user = await query;
      return user;
    } catch (error) {
      logger.error(`Error in UserService.getUserByEmail: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Object} Created user
   */
  async createUser(userData) {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        const error = new Error('User already exists with this email');
        error.statusCode = 400;
        throw error;
      }

      const user = await User.create(userData);
      
      // Remove password from response
      user.password = undefined;
      
      logger.info(`New user created: ${user.email}`);
      return user;
    } catch (error) {
      logger.error(`Error in UserService.createUser: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user
   */
  async updateUser(userId, updateData) {
    try {
      // Remove sensitive fields that shouldn't be updated directly
      const { password, ...safeUpdateData } = updateData;
      
      const user = await User.findByIdAndUpdate(
        userId,
        safeUpdateData,
        {
          new: true,
          runValidators: true
        }
      ).select('-password');

      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      logger.info(`User updated: ${user.email}`);
      return user;
    } catch (error) {
      logger.error(`Error in UserService.updateUser: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Object} Deleted user
   */
  async deleteUser(userId) {
    try {
      const user = await User.findByIdAndDelete(userId);
      
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      logger.info(`User deleted: ${user.email}`);
      return user;
    } catch (error) {
      logger.error(`Error in UserService.deleteUser: ${error.message}`);
      throw error;
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} User data and token
   */
  async loginUser(email, password) {
    try {
      // Get user with password
      const user = await this.getUserByEmail(email, true);
      
      if (!user) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
      }

      // Check if user is active
      if (!user.isActive) {
        const error = new Error('Account is deactivated');
        error.statusCode = 401;
        throw error;
      }

      // Check password
      const isMatch = await user.matchPassword(password);
      
      if (!isMatch) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = user.getSignedJwtToken();
      
      // Remove password from response
      user.password = undefined;

      logger.info(`User logged in: ${user.email}`);
      return { user, token };
    } catch (error) {
      logger.error(`Error in UserService.loginUser: ${error.message}`);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Object} Updated user
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');
      
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      // Check current password
      const isMatch = await user.matchPassword(currentPassword);
      
      if (!isMatch) {
        const error = new Error('Current password is incorrect');
        error.statusCode = 400;
        throw error;
      }

      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);
      return user;
    } catch (error) {
      logger.error(`Error in UserService.changePassword: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new UserService();