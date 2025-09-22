const mongoose = require('mongoose');
const { env } = require('./env');
const logger = require('../utils/logger');

mongoose.set('strictQuery', true);

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: !process.env.NODE_ENV === 'production',
    });
    logger.info('✅ MongoDB connected');
  } catch (err) {
    logger.error('❌ MongoDB connection failed', { err });
    process.exit(1);
  }
};

// Graceful shutdown
mongoose.connection.on('error', (err) => logger.error('Mongo error', { err }));
mongoose.connection.on('disconnected', () => logger.warn('Mongo disconnected'));

module.exports = connectDB;
