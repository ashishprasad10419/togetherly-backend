const rateLimit = require('express-rate-limit');

// Key by authenticated user id when available, otherwise fall back to IP.
// Prevents a single signed-in user from spamming regardless of their network.
const keyByUser = (req) => req.userId || req.ip;

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByUser,
  message: { error: 'Too many requests, please try again shortly.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, try again later.' },
});

// Tighter limit for write-heavy endpoints (send message, upload). Per-user.
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByUser,
  message: { error: 'You are sending too quickly. Please slow down.' },
});

module.exports = { apiLimiter, authLimiter, writeLimiter };
