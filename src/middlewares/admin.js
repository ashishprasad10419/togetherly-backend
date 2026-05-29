const ApiError = require('../utils/apiError');

/**
 * Lightweight admin gate. Set ADMIN_TOKEN in env, then send
 * `x-admin-token: <token>` on requests. Avoids needing a separate "role"
 * field on User just to ship a dashboard.
 */
module.exports = function adminOnly(req, _res, next) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return next(ApiError.forbidden('Admin endpoints are disabled (no ADMIN_TOKEN set).'));
  const provided = req.headers['x-admin-token'];
  if (!provided || provided !== expected) return next(ApiError.forbidden('Bad admin token.'));
  next();
};
