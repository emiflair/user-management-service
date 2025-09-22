const { celebrate, Segments, Joi } = require('celebrate');

const registerSchema = celebrate({
  [Segments.BODY]: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('student', 'instructor', 'admin').optional(),
  }),
});

const loginSchema = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
});

const updateMeSchema = celebrate({
  [Segments.BODY]: Joi.object({
    username: Joi.string().min(3).max(50),
    email: Joi.string().email(),
  }).min(1),
});

const changePasswordSchema = celebrate({
  [Segments.BODY]: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
  }),
});

const listUsersSchema = celebrate({
  [Segments.QUERY]: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    role: Joi.string().valid('student', 'instructor', 'admin'),
    search: Joi.string(),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateMeSchema,
  changePasswordSchema,
  listUsersSchema,
};
