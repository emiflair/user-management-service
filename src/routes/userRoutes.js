const express = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/userController');
const { auth, authorize } = require('../middlewares/authMiddleware');
const {
  registerSchema,
  loginSchema,
  updateMeSchema,
  changePasswordSchema,
  listUsersSchema,
  objectIdSchema,
} = require('../middlewares/validate');

const router = express.Router({ caseSensitive: true });

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

// Public
router.post('/register', authLimiter, registerSchema, ctrl.register);
router.post('/login',    authLimiter, loginSchema,    ctrl.login);

// Authenticated user
router.get('/me',                  auth(),                       ctrl.me);
router.patch('/me',                auth(), updateMeSchema,       ctrl.updateMe);
router.post('/me/change-password', auth(), changePasswordSchema, ctrl.changePassword);

// Admin
router.get('/',       auth(), authorize('admin'), listUsersSchema, ctrl.list);
router.delete('/:id', auth(), authorize('admin'), objectIdSchema,  ctrl.remove);

module.exports = router;
