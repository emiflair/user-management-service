// Load & validate environment variables
const path = require('path');
const dotenv = require('dotenv');
const Joi = require('joi');

dotenv.config({ path: path.join(process.cwd(), '.env') });

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(5000),
  MONGO_URI: Joi.string().uri({ scheme: ['mongodb', 'mongodb+srv'] }).required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  CORS_ORIGIN: Joi.string().allow('*').default('*'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: Joi.number().default(300),
  BCRYPT_SALT_ROUNDS: Joi.number().default(10),
}).unknown();

const { value: env, error } = schema.validate(process.env);
if (error) {
  // Stop the app when env is invalid
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:', error.message);
  process.exit(1);
}

module.exports = {
  env,
  isProd: env.NODE_ENV === 'production',
};
