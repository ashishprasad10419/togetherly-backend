const ApiError = require('../utils/apiError');

module.exports = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
