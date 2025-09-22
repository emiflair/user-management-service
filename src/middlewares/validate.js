const { celebrate, Segments, Joi } = require('celebrate');

const registerSchema = celebrate({
  [Segments.BODY]: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('student', 'instructor', 'admin').optional(),
  }),
}, { abortEarly: false });

const loginSchema = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
}, { abortEarly: false });

const updateMeSchema = celebrate({
  [Segments.BODY]: Joi.object({
    username: Joi.string().min(3).max(50),
    email: Joi.string().email(),
  }).min(1),
}, { abortEarly: false });

const changePasswordSchema = celebrate({
  [Segments.BODY]: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
  }),
}, { abortEarly: false });

const listUsersSchema = celebrate({
  [Segments.QUERY]: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    role: Joi.string().valid('student', 'instructor', 'admin'),
    search: Joi.string(),
  }),
}, { abortEarly: false });

const objectIdSchema = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,          // <- lowercase export to match your routes
  updateMeSchema,
  changePasswordSchema,
  listUsersSchema,
  objectIdSchema,       // <- new export for /:id
};
