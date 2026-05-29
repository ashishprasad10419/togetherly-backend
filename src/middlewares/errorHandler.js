const logger = require('../utils/logger');
const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const payload = {
    error: err.message || 'Internal server error',
    ...(err.details ? { details: err.details } : {}),
  };
  if (env.nodeEnv !== 'production' && status >= 500) {
    payload.stack = err.stack;
  }
  if (status >= 500) logger.error(err);
  res.status(status).json(payload);
};
