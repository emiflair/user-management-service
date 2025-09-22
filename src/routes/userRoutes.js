const express = require('express');
const ctrl = require('../controllers/userController');
const { auth, authorize } = require('../middlewares/authMiddleware');
const {
  registerSchema,
  loginSchema,
  updateMeSchema,
  changePasswordSchema,
  listUsersSchema,
} = require('../middlewares/validate');

const router = express.Router();

// Public
router.post('/register', registerSchema, ctrl.register);
router.post('/login', loginSchema, ctrl.login);

// Authenticated user
router.get('/me', auth(), ctrl.me);
router.patch('/me', auth(), updateMeSchema, ctrl.updateMe);
router.post('/me/change-password', auth(), changePasswordSchema, ctrl.changePassword);

// Admin
router.get('/', auth(), authorize('admin'), listUsersSchema, ctrl.list);
router.delete('/:id', auth(), authorize('admin'), ctrl.remove);

module.exports = router;
