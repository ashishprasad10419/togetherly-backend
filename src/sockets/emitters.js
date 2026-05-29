let io = null;

function setIO(instance) {
  io = instance;
}

function emitToChat(chatId, event, payload, exceptUserId) {
  if (!io) return;
  let target = io.to(`chat:${chatId}`);
  if (exceptUserId) target = target.except(`user:${exceptUserId}`);
  target.emit(event, payload);
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { setIO, emitToChat, emitToUser };
