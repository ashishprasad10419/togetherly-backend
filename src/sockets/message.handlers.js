const { persistMessage, ensureMembership } = require('../services/message.service');
const Message = require('../models/Message');
const logger = require('../utils/logger');

module.exports = function registerMessageHandlers(io, socket) {
  const userId = socket.userId;

  socket.on('chat:join', async ({ chatId }, ack) => {
    try {
      await ensureMembership(chatId, userId);
      socket.join(`chat:${chatId}`);
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('chat:leave', ({ chatId }) => {
    socket.leave(`chat:${chatId}`);
  });

  socket.on('message:send', async (payload, ack) => {
    try {
      const message = await persistMessage({
        chatId: payload.chatId,
        senderId: userId,
        type: payload.type,
        content: payload.content,
        attachments: payload.attachments,
        replyTo: payload.replyTo,
        forwardedFrom: payload.forwardedFrom,
      });
      // Skip sender's own connections — they get the message via ack.
      socket.to(`chat:${payload.chatId}`).emit('message:new', { message });
      ack?.({ ok: true, message });
    } catch (err) {
      logger.error('message:send failed', err);
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('message:delivered', async ({ messageId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { $addToSet: { deliveredTo: userId } });
      const msg = await Message.findById(messageId).select('chat sender');
      if (msg) io.to(`chat:${msg.chat}`).emit('message:delivered', { messageId, userId });
    } catch (err) {
      logger.error('message:delivered failed', err);
    }
  });

  socket.on('message:read', async ({ chatId }) => {
    try {
      await ensureMembership(chatId, userId);
      await Message.updateMany(
        { chat: chatId, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId, deliveredTo: userId } }
      );
      io.to(`chat:${chatId}`).emit('message:read', { chatId, userId });
    } catch (err) {
      logger.error('message:read failed', err);
    }
  });

  socket.on('typing:start', ({ chatId }) => {
    socket.to(`chat:${chatId}`).emit('typing:start', { chatId, userId });
  });

  socket.on('typing:stop', ({ chatId }) => {
    socket.to(`chat:${chatId}`).emit('typing:stop', { chatId, userId });
  });
};
