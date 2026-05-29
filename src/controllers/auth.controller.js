const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { generateTokens, verifyRefresh } = require('../utils/jwt');
const { createOtp, verifyOtp } = require('../services/otp.service');

exports.signup = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('Email is already in use');

  const user = await User.create({ name, email, phone, password });
  const { accessToken, refreshToken } = generateTokens(user);

  user.refreshTokens = [refreshToken];
  await user.save();

  res.status(201).json({ user, accessToken, refreshToken });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user) throw ApiError.unauthorized('Invalid credentials');

  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');

  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
  user.lastSeen = new Date();
  await user.save();

  res.json({ user, accessToken, refreshToken });
});

exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  let decoded;
  try {
    decoded = verifyRefresh(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !user.refreshTokens?.includes(refreshToken)) {
    throw ApiError.unauthorized('Refresh token revoked');
  }

  const tokens = generateTokens(user);
  user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken).concat(tokens.refreshToken);
  await user.save();

  res.json(tokens);
});

exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const user = await User.findById(req.userId).select('+refreshTokens');
    if (user) {
      user.refreshTokens = (user.refreshTokens || []).filter((t) => t !== refreshToken);
      user.isOnline = false;
      user.lastSeen = new Date();
      await user.save();
    }
  }
  res.json({ ok: true });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

exports.requestOtp = asyncHandler(async (req, res) => {
  const { identifier, purpose } = req.body;
  const result = await createOtp(identifier, purpose);
  res.json(result);
});

exports.verifyOtpHandler = asyncHandler(async (req, res) => {
  const { identifier, code, purpose } = req.body;
  const ok = await verifyOtp(identifier, code, purpose);
  if (!ok) throw ApiError.badRequest('Invalid or expired code');
  res.json({ ok: true });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { identifier, code, newPassword } = req.body;
  const ok = await verifyOtp(identifier, code, 'reset');
  if (!ok) throw ApiError.badRequest('Invalid or expired code');

  const user = await User.findOne({ email: identifier.toLowerCase() }).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();

  res.json({ ok: true });
});
