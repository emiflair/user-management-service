/**
 * User Controller
 * 
 * Handles HTTP requests for user-related operations including authentication,
 * profile management, and administrative functions. All controller methods
 * are wrapped with catchAsync for centralized error handling.
 * 
 * Features:
 * - User registration and authentication
 * - Profile management (view, update, password change)
 * - Administrative user management (list, delete)
 * - Role-based access control integration
 * - Comprehensive error handling
 * 
 * @module controllers/userController
 */

const catchAsync = require('../utils/catchAsync');
const {
  createUser,
  login,
  getUserById,
  updateMe,
  changePassword,
  listUsers,
  deleteUser,
} = require('../services/userService');

/**
 * Register a new user
 * 
 * Creates a new user account with the provided information.
 * Validates input data and ensures email/username uniqueness.
 * 
 * @async
 * @function register
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user data
 * @param {string} req.body.username - Unique username (3-50 characters)
 * @param {string} req.body.email - Unique email address
 * @param {string} req.body.password - Password (minimum 8 characters)
 * @param {string} [req.body.role='student'] - User role (student, instructor, admin)
 * @param {Object} res - Express response object
 * 
 * @returns {Promise<void>} HTTP 201 with user data (excluding password)
 * 
 * @throws {409} Conflict - Email or username already exists
 * @throws {400} Bad Request - Invalid input data
 * 
 * @example
 * POST /api/users/register
 * {
 *   "username": "johndoe",
 *   "email": "john@example.com",
 *   "password": "securepassword123",
 *   "role": "student"
 * }
 */
exports.register = catchAsync(async (req, res) => {
  const user = await createUser(req.body);
  res.status(201).json({ message: 'User registered', user });
});

/**
 * Authenticate user login
 * 
 * Verifies user credentials and returns authentication token.
 * Updates user's last login time and resets failed login attempts on success.
 * 
 * @async
 * @function login
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing login credentials
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 * 
 * @returns {Promise<void>} HTTP 200 with JWT token and user data
 * 
 * @throws {401} Unauthorized - Invalid credentials or inactive account
 * @throws {400} Bad Request - Missing email or password
 * 
 * @example
 * POST /api/users/login
 * {
 *   "email": "john@example.com",
 *   "password": "securepassword123"
 * }
 * 
 * Response:
 * {
 *   "message": "Login successful",
 *   "token": "eyJhbGciOiJIUzI1NiIs...",
 *   "user": { "id": "...", "username": "johndoe", ... }
 * }
 */
exports.login = catchAsync(async (req, res) => {
  const { user, token } = await login(req.body.email, req.body.password);
  res.json({ message: 'Login successful', token, user });
});

/**
 * Get current user profile
 * 
 * Returns the authenticated user's profile information.
 * Requires valid JWT token in Authorization header.
 * 
 * @async
 * @function me
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object (added by auth middleware)
 * @param {string} req.user.id - User's ID from JWT token
 * @param {Object} res - Express response object
 * 
 * @returns {Promise<void>} HTTP 200 with user profile data
 * 
 * @throws {401} Unauthorized - Invalid or missing JWT token
 * @throws {404} Not Found - User not found
 * 
 * @example
 * GET /api/users/me
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Response:
 * {
 *   "user": {
 *     "id": "...",
 *     "username": "johndoe",
 *     "email": "john@example.com",
 *     "role": "student",
 *     "isActive": true,
 *     "createdAt": "2023-...",
 *     "updatedAt": "2023-..."
 *   }
 * }
 */
exports.me = catchAsync(async (req, res) => {
  const user = await getUserById(req.user.id);
  res.json({ user });
});

/**
 * Update current user profile
 * 
 * Allows authenticated users to update their own profile information.
 * Only specific fields (username, email) can be updated for security.
 * 
 * @async
 * @function updateMe
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object (added by auth middleware)
 * @param {string} req.user.id - User's ID from JWT token
 * @param {Object} req.body - Request body containing update data
 * @param {string} [req.body.username] - New username
 * @param {string} [req.body.email] - New email address
 * @param {Object} res - Express response object
 * 
 * @returns {Promise<void>} HTTP 200 with updated user data
 * 
 * @throws {401} Unauthorized - Invalid or missing JWT token
 * @throws {404} Not Found - User not found
 * @throws {409} Conflict - Username or email already exists
 * @throws {400} Bad Request - Invalid input data or validation errors
 * 
 * @example
 * PUT /api/users/me
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * {
 *   "username": "newusername",
 *   "email": "newemail@example.com"
 * }
 */
exports.updateMe = catchAsync(async (req, res) => {
  const user = await updateMe(req.user.id, req.body);
  res.json({ message: 'Profile updated', user });
});

/**
 * Change user password
 * 
 * Allows authenticated users to change their password by providing
 * their current password and a new password.
 * 
 * @async
 * @function changePassword
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object (added by auth middleware)
 * @param {string} req.user.id - User's ID from JWT token
 * @param {Object} req.body - Request body containing password data
 * @param {string} req.body.currentPassword - User's current password
 * @param {string} req.body.newPassword - New password (minimum 8 characters)
 * @param {Object} res - Express response object
 * 
 * @returns {Promise<void>} HTTP 200 with success message
 * 
 * @throws {401} Unauthorized - Invalid or missing JWT token
 * @throws {400} Bad Request - Current password incorrect or validation errors
 * @throws {404} Not Found - User not found
 * 
 * @example
 * POST /api/users/change-password
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * {
 *   "currentPassword": "oldpassword123",
 *   "newPassword": "newsecurepassword456"
 * }
 */
exports.changePassword = catchAsync(async (req, res) => {
  await changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  res.json({ message: 'Password changed' });
});

/**
 * Administrative Functions
 * 
 * The following functions are restricted to users with administrative privileges.
 * They require appropriate role-based access control (RBAC) middleware.
 */

/**
 * List all users (Admin only)
 * 
 * Returns a paginated list of users with optional filtering and search capabilities.
 * Supports role filtering and text search across username and email fields.
 * 
 * @async
 * @function list
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters for filtering and pagination
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=10] - Number of users per page
 * @param {string} [req.query.role] - Filter by user role (student, instructor, admin)
 * @param {string} [req.query.search] - Search term for username/email
 * @param {Object} res - Express response object
 * 
 * @returns {Promise<void>} HTTP 200 with paginated user list
 * 
 * @throws {401} Unauthorized - Invalid or missing JWT token
 * @throws {403} Forbidden - Insufficient permissions (non-admin)
 * 
 * @example
 * GET /api/users?page=1&limit=10&role=student&search=john
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Response:
 * {
 *   "items": [...],
 *   "page": 1,
 *   "limit": 10,
 *   "total": 25,
 *   "pages": 3
 * }
 */
exports.list = catchAsync(async (req, res) => {
  const result = await listUsers(req.query);
  res.json(result);
});

/**
 * Delete a user (Admin only)
 * 
 * Permanently removes a user account from the system.
 * This action cannot be undone.
 * 
 * @async
 * @function remove
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - User ID to delete
 * @param {Object} res - Express response object
 * 
 * @returns {Promise<void>} HTTP 204 (No Content) on successful deletion
 * 
 * @throws {401} Unauthorized - Invalid or missing JWT token
 * @throws {403} Forbidden - Insufficient permissions (non-admin)
 * @throws {404} Not Found - User not found
 * 
 * @example
 * DELETE /api/users/60d5ecb54b24a63f5c7b1234
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Response: 204 No Content (empty body)
 */
exports.remove = catchAsync(async (req, res) => {
  await deleteUser(req.params.id);
  res.status(204).send();
});
