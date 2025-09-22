const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

function auth(required = true) {
  return (req, _res, next) => {
    const header = req.header('Authorization');
    const token = header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;

    if (!token) {
      if (required) return next(new ApiError(401, 'Authentication required'));
      req.user = null;
      return next();
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      req.user = { id: payload.sub, role: payload.role };
      return next();
    } catch {
      return next(new ApiError(401, 'Invalid or expired token'));
    }
  };
}

function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }
    return next();
  };
}

module.exports = { auth, authorize };
