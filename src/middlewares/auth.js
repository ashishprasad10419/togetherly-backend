const { verifyAccess } = require('../utils/jwt');
const ApiError = require('../utils/apiError');
const User = require('../models/User');

async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized('Missing token');

    const decoded = verifyAccess(token);
    const user = await User.findById(decoded.id);
    if (!user) throw ApiError.unauthorized('User no longer exists');

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(ApiError.unauthorized('Token expired'));
    if (err.name === 'JsonWebTokenError') return next(ApiError.unauthorized('Invalid token'));
    next(err);
  }
}

module.exports = { authenticate };
