const Chat = require('../models/Chat');
const Message = require('../models/Message');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { ensureMembership, persistMessage } = require('../services/message.service');
const { emitToChat, emitToUser } = require('../sockets/emitters');

exports.listMessages = asyncHandler(async (req, res) => {
  const chatId = req.params.chatId;
  await ensureMembership(chatId, req.userId);

  const { before, limit = 30 } = req.query;
  const query = { chat: chatId, deletedFor: { $ne: req.userId } };
  if (before) query.createdAt = { $lt: new Date(before) };

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(parseInt(limit, 10) || 30, 100))
    .populate('sender', 'name avatar')
    .populate({ path: 'replyTo', populate: { path: 'sender', select: 'name avatar' } });

  res.json({ messages: messages.reverse() });
});

exports.send = asyncHandler(async (req, res) => {
  const message = await persistMessage({
    chatId: req.body.chatId,
    senderId: req.userId,
    type: req.body.type,
    content: req.body.content,
    attachments: req.body.attachments,
    replyTo: req.body.replyTo,
    forwardedFrom: req.body.forwardedFrom,
  });

  // Exclude sender — they get the canonical message via this HTTP response.
  emitToChat(req.body.chatId, 'message:new', { message }, req.userId);
  res.status(201).json({ message });
});

exports.markRead = asyncHandler(async (req, res) => {
  const chatId = req.params.chatId;
  await ensureMembership(chatId, req.userId);

  await Message.updateMany(
    { chat: chatId, readBy: { $ne: req.userId } },
    { $addToSet: { readBy: req.userId, deliveredTo: req.userId } }
  );

  // reset unread for this user
  const chat = await Chat.findById(chatId);
  if (chat) {
    chat.unread.set(req.userId, 0);
    await chat.save();
  }

  emitToChat(chatId, 'message:read', { chatId, userId: req.userId });
  res.json({ ok: true });
});

exports.deleteForMe = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) throw ApiError.notFound('Message not found');
  await ensureMembership(message.chat, req.userId);

  if (!message.deletedFor.includes(req.userId)) {
    message.deletedFor.push(req.userId);
    await message.save();
  }
  res.json({ ok: true });
});

exports.deleteForEveryone = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) throw ApiError.notFound('Message not found');
  if (message.sender.toString() !== req.userId) {
    throw ApiError.forbidden('Only the sender can delete for everyone');
  }

  message.isDeletedForEveryone = true;
  message.content = '';
  message.attachments = [];
  await message.save();

  emitToChat(message.chat, 'message:deleted', { messageId: message._id, chatId: message.chat });
  res.json({ ok: true });
});

exports.forward = asyncHandler(async (req, res) => {
  const { messageId, chatIds } = req.body;
  const source = await Message.findById(messageId);
  if (!source) throw ApiError.notFound('Source message not found');

  const created = [];
  for (const chatId of chatIds) {
    const forwarded = await persistMessage({
      chatId,
      senderId: req.userId,
      type: source.type,
      content: source.content,
      attachments: source.attachments,
      forwardedFrom: source.sender,
    });
    emitToChat(chatId, 'message:new', { message: forwarded });
    created.push(forwarded);
  }
  res.json({ messages: created });
});

exports.react = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) throw ApiError.notFound('Message not found');
  await ensureMembership(message.chat, req.userId);

  const { emoji } = req.body;
  const idx = message.reactions.findIndex((r) => r.user.toString() === req.userId);
  if (idx >= 0) {
    if (message.reactions[idx].emoji === emoji) message.reactions.splice(idx, 1);
    else message.reactions[idx].emoji = emoji;
  } else {
    message.reactions.push({ user: req.userId, emoji });
  }
  await message.save();
  emitToChat(message.chat, 'message:reaction', { messageId: message._id, reactions: message.reactions });
  res.json({ reactions: message.reactions });
});

exports.search = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ messages: [] });

  const chats = await Chat.find({ participants: req.userId }).select('_id');
  const chatIds = chats.map((c) => c._id);

  const messages = await Message.find({
    chat: { $in: chatIds },
    content: { $regex: q, $options: 'i' },
    deletedFor: { $ne: req.userId },
    isDeletedForEveryone: false,
  })
    .limit(50)
    .sort({ createdAt: -1 })
    .populate('sender', 'name avatar')
    .populate('chat', 'isGroup name participants');
  res.json({ messages });
});
