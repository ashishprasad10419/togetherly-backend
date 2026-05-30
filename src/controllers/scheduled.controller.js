const ScheduledMessage = require('../models/ScheduledMessage');
const Chat = require('../models/Chat');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const items = await ScheduledMessage.find({
    sender: req.userId,
    delivered: false,
  })
    .sort({ sendAt: 1 })
    .populate('chat', 'name isGroup participants');
  res.json({ scheduled: items });
});

exports.create = asyncHandler(async (req, res) => {
  const { chatId, content, sendAt } = req.body;
  const chat = await Chat.findOne({ _id: chatId, participants: req.userId });
  if (!chat) throw ApiError.notFound('Chat not found');

  const job = await ScheduledMessage.create({
    chat: chatId,
    sender: req.userId,
    content,
    sendAt: new Date(sendAt),
  });
  res.status(201).json({ scheduled: job });
});

exports.cancel = asyncHandler(async (req, res) => {
  const job = await ScheduledMessage.findOne({ _id: req.params.id, sender: req.userId, delivered: false });
  if (!job) throw ApiError.notFound('Scheduled message not found');
  await job.deleteOne();
  res.json({ ok: true });
});
