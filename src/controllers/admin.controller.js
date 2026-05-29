const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Call = require('../models/Call');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../services/audit.service');
const userService = require('../services/user.service');
const ApiError = require('../utils/apiError');

exports.stats = asyncHandler(async (req, res) => {
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const totalUsers = await User.countDocuments();
  const totalWithDeleted = await User.countDocuments({}).setOptions({ withDeleted: true });
  const deletedUsers = totalWithDeleted - totalUsers;
  const onlineUsers = await User.countDocuments({ isOnline: true });
  const activeNow = await User.countDocuments({ lastSeen: { $gte: fifteenMinAgo } });
  const signups24h = await User.countDocuments({ createdAt: { $gte: last24h } });
  const signups7d = await User.countDocuments({ createdAt: { $gte: last7d } });
  const totalChats = await Chat.countDocuments();
  const groupChats = await Chat.countDocuments({ isGroup: true });
  const totalMessages = await Message.countDocuments();
  const messages24h = await Message.countDocuments({ createdAt: { $gte: last24h } });
  const totalCalls = await Call.countDocuments();
  const storageSamples = await Message.aggregate([
    { $unwind: '$attachments' },
    { $group: { _id: null, totalBytes: { $sum: '$attachments.size' } } },
  ]);

  await audit.record({ actor: null, action: 'admin.stats', ip: req.ip });

  res.json({
    users: {
      total: totalUsers,
      deleted: deletedUsers,
      onlineRightNow: onlineUsers,
      activeLast15min: activeNow,
      signups24h,
      signups7d,
    },
    chats: { total: totalChats, groups: groupChats, oneToOne: totalChats - groupChats },
    messages: { total: totalMessages, last24h: messages24h },
    calls: { total: totalCalls },
    storage: { uploadedBytes: storageSamples[0]?.totalBytes || 0 },
    generatedAt: new Date().toISOString(),
  });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const includeDeleted = req.query.includeDeleted === 'true';
  const q = (req.query.q || '').trim();
  const filter = q
    ? { $or: [{ email: { $regex: q, $options: 'i' } }, { name: { $regex: q, $options: 'i' } }] }
    : {};
  const query = User.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .select('name email phone avatar isOnline lastSeen deletedAt createdAt');
  if (includeDeleted) query.setOptions({ withDeleted: true });
  const users = await query;
  res.json({ users });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.softDeleteUser(req.params.id, { ip: req.ip });
  if (!result.ok) throw ApiError.badRequest(result.reason);
  res.json({ ok: true });
});

exports.listAudit = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200).populate('actor', 'name email');
  res.json({ logs });
});
