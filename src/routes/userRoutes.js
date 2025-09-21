const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  getMe,
  updateMe
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', createUser);
router.post('/login', loginUser);

// Protected routes (require authentication)
router.use(protect); // All routes after this middleware are protected

// Current user routes
router.route('/me')
  .get(getMe)
  .put(updateMe);

// User management routes
router.route('/')
  .get(authorize('admin', 'moderator'), getUsers);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(authorize('admin'), deleteUser);

module.exports = router;