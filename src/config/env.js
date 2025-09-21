const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const requiredEnvVars = [
  'NODE_ENV',
  'PORT'
];

const validateEnv = () => {
  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Warn about missing optional but important vars
  if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
    console.warn('Warning: No MongoDB URI found. Using default localhost connection.');
  }
  
  if (!process.env.JWT_SECRET) {
    console.warn('Warning: No JWT_SECRET found. Using default secret (not secure for production).');
  }
};

const getEnvConfig = () => {
  validateEnv();
  
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT, 10) || 3000,
    MONGODB_URI: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/user_management',
    JWT_SECRET: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  };
};

module.exports = getEnvConfig;