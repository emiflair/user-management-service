/**
 * Async Error Handler Utility
 * 
 * A higher-order function that wraps async route handlers and middleware
 * to automatically catch and forward any rejected promises to Express's
 * error handling middleware. This eliminates the need for try-catch blocks
 * in every async route handler.
 * 
 * Benefits:
 * - Eliminates repetitive try-catch blocks in controllers
 * - Ensures all async errors are properly handled
 * - Maintains clean, readable controller code
 * - Integrates seamlessly with Express error handling
 * 
 * @module utils/catchAsync
 */

/**
 * Wraps async functions to handle promise rejections
 * 
 * Takes an async function and returns a new function that automatically
 * catches any promise rejections and passes them to the Express error
 * handling middleware via the next() function.
 * 
 * @function catchAsync
 * @param {Function} fn - Async function to wrap (typically a route handler)
 * @returns {Function} Express middleware function with automatic error handling
 * 
 * @example
 * // Without catchAsync (requires manual error handling)
 * exports.getUser = async (req, res, next) => {
 *   try {
 *     const user = await User.findById(req.params.id);
 *     res.json({ user });
 *   } catch (error) {
 *     next(error);
 *   }
 * };
 * 
 * // With catchAsync (automatic error handling)
 * exports.getUser = catchAsync(async (req, res) => {
 *   const user = await User.findById(req.params.id);
 *   res.json({ user });
 * });
 * 
 * @example
 * // Usage in route definitions
 * const catchAsync = require('../utils/catchAsync');
 * 
 * router.get('/users/:id', catchAsync(async (req, res) => {
 *   const user = await userService.getUserById(req.params.id);
 *   res.json({ user });
 * }));
 */
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
