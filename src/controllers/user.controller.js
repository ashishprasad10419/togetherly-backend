const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

exports.search = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ users: [] });

  const users = await User.find({
    _id: { $ne: req.userId },
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
    ],
  })
    .limit(20)
    .select('name email phone avatar bio isOnline lastSeen');

  res.json({ users });
});

exports.getById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('name email avatar bio isOnline lastSeen privacy');
  if (!user) throw ApiError.notFound('User not found');
  res.json({ user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true });
  res.json({ user });
});

exports.updatePrivacy = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  user.privacy = { ...user.privacy.toObject?.() || user.privacy, ...req.body };
  await user.save();
  res.json({ user });
});

exports.contacts = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).populate(
    'contacts',
    'name email avatar bio isOnline lastSeen'
  );
  res.json({ contacts: user.contacts });
});

exports.addContact = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (userId === req.userId) throw ApiError.badRequest("Can't add yourself");
  const target = await User.findById(userId);
  if (!target) throw ApiError.notFound('User not found');

  await User.findByIdAndUpdate(req.userId, { $addToSet: { contacts: userId } });
  res.json({ ok: true });
});

exports.removeContact = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.userId, { $pull: { contacts: req.params.id } });
  res.json({ ok: true });
});

exports.block = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (userId === req.userId) throw ApiError.badRequest("Can't block yourself");
  await User.findByIdAndUpdate(req.userId, { $addToSet: { blocked: userId } });
  res.json({ ok: true });
});

exports.unblock = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.userId, { $pull: { blocked: req.params.id } });
  res.json({ ok: true });
});

exports.registerPushToken = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.userId, { $addToSet: { pushTokens: req.body.token } });
  res.json({ ok: true });
});

exports.unregisterPushToken = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.userId, { $pull: { pushTokens: req.body.token } });
  res.json({ ok: true });
});

exports.registerPublicKey = asyncHandler(async (req, res) => {
  const { publicKey } = req.body;
  if (!publicKey || typeof publicKey !== 'string') throw ApiError.badRequest('publicKey required');
  if (publicKey.length > 256) throw ApiError.badRequest('publicKey too long');
  await User.findByIdAndUpdate(req.userId, { publicKey });
  res.json({ ok: true });
});

exports.getPublicKey = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('publicKey');
  if (!user) throw ApiError.notFound('User not found');
  res.json({ publicKey: user.publicKey || null });
});
