const { isCelebrateError, errors: celebrateErrors } = require('celebrate');
const ApiError = require('./ApiError');
const logger = require('./logger');
const { isProd } = require('../config/env');

// Attach after routes: 404 -> error converter -> error handler
const notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.originalUrl}`));

const converter = (err, _req, _res, next) => {
  if (isCelebrateError(err)) {
    // Extract the first joi message
    const details = [...err.details.values()][0].details?.[0];
    return next(new ApiError(400, details?.message || 'Validation error'));
  }
  if (!(err instanceof ApiError)) {
    const status = err.statusCode || 500;
    return next(new ApiError(status, err.message || 'Internal Server Error'));
  }
  return next(err);
};

const handler = (err, _req, res, _next) => {
  const status = err.statusCode || 500;
  const payload = {
    status,
    message: err.message || 'Internal Server Error',
  };
  if (!isProd) payload.stack = err.stack;

  if (status >= 500) logger.error(err);
  else logger.warn(err.message);

  res.status(status).json(payload);
};

// Export celebrate error middleware (must be before our converter)
module.exports = { notFound, converter, handler, celebrateErrors };
