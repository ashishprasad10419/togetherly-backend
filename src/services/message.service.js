const Chat = require('../models/Chat');
const Message = require('../models/Message');
const ApiError = require('../utils/apiError');

async function ensureMembership(chatId, userId) {
  const chat = await Chat.findById(chatId);
  if (!chat) throw ApiError.notFound('Chat not found');
  if (!chat.participants.some((id) => id.toString() === userId.toString())) {
    throw ApiError.forbidden('You are not a participant of this chat');
  }
  return chat;
}

async function persistMessage({ chatId, senderId, type, content, attachments, replyTo, forwardedFrom }) {
  const chat = await ensureMembership(chatId, senderId);

  const message = await Message.create({
    chat: chatId,
    sender: senderId,
    type: type || (attachments?.length ? attachments[0].type : 'text'),
    content: content || '',
    attachments: attachments || [],
    replyTo,
    forwardedFrom,
    deliveredTo: [senderId],
    readBy: [senderId],
  });

  // bump unread per participant (excluding sender)
  const unread = chat.unread || new Map();
  chat.participants.forEach((id) => {
    const key = id.toString();
    if (key === senderId.toString()) {
      unread.set(key, 0);
      return;
    }
    unread.set(key, (unread.get(key) || 0) + 1);
  });
  chat.unread = unread;
  chat.lastMessage = message._id;
  chat.lastMessageAt = new Date();
  await chat.save();

  return message.populate([
    { path: 'sender', select: 'name avatar' },
    { path: 'replyTo', populate: { path: 'sender', select: 'name avatar' } },
  ]);
}

module.exports = { ensureMembership, persistMessage };
