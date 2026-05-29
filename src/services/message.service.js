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

async function persistMessage({
  chatId,
  senderId,
  type,
  content,
  attachments,
  replyTo,
  forwardedFrom,
  poll,
  location,
}) {
  const chat = await ensureMembership(chatId, senderId);

  const expiresAt =
    chat.disappearAfterSeconds && chat.disappearAfterSeconds > 0
      ? new Date(Date.now() + chat.disappearAfterSeconds * 1000)
      : undefined;

  const message = await Message.create({
    chat: chatId,
    sender: senderId,
    type: type || (poll ? 'poll' : location ? 'location' : attachments?.length ? attachments[0].type : 'text'),
    content: content || '',
    attachments: attachments || [],
    replyTo,
    forwardedFrom,
    poll: poll && poll.question ? { question: poll.question, options: (poll.options || []).map((o) => ({ text: o.text || String(o) })) } : undefined,
    location: location && typeof location.lat === 'number' && typeof location.lng === 'number'
      ? { lat: location.lat, lng: location.lng, label: location.label }
      : undefined,
    deliveredTo: [senderId],
    readBy: [senderId],
    expiresAt,
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
