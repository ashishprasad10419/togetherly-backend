const { Server } = require('socket.io');
const env = require('../config/env');
const { verifyAccess } = require('../utils/jwt');
const User = require('../models/User');
const Chat = require('../models/Chat');
const logger = require('../utils/logger');
const registerMessageHandlers = require('./message.handlers');
const registerPresenceHandlers = require('./presence.handlers');
const registerCallHandlers = require('./call.handlers');
const { setIO } = require('./emitters');

let ioRef = null;

function authMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Missing token'));
    const decoded = verifyAccess(token);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
}

function userRoom(userId) {
  return `user:${userId}`;
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientUrl === '*' ? true : env.clientUrl, credentials: true },
    pingTimeout: 60000,
  });

  ioRef = io;
  setIO(io);

  io.use(authMiddleware);

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    logger.info(`[socket] connected user=${userId} sid=${socket.id}`);

    socket.join(userRoom(userId));

    try {
      // Join all of the user's chat rooms
      const chats = await Chat.find({ participants: userId }).select('_id');
      chats.forEach((c) => socket.join(`chat:${c._id}`));

      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      socket.broadcast.emit('presence:online', { userId });

      // Send the connecting client a snapshot of who is currently online so it
      // doesn't have to wait for deltas. Limited to contacts to avoid leaking
      // strangers' presence.
      const me = await User.findById(userId).select('contacts');
      const ids = (me?.contacts || []).slice(0, 500);
      const onlines = await User.find({ _id: { $in: ids }, isOnline: true }).select('_id');
      socket.emit('presence:snapshot', { userIds: onlines.map((u) => u._id.toString()) });
    } catch (err) {
      logger.error('socket connect setup failed', err);
    }

    registerPresenceHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerCallHandlers(io, socket);

    socket.on('disconnect', async () => {
      logger.info(`[socket] disconnected user=${userId}`);
      try {
        // Only mark offline if NO other sockets remain for this user.
        const room = io.sockets.adapter.rooms.get(userRoom(userId));
        const remaining = room ? room.size : 0;
        if (remaining === 0) {
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
          io.emit('presence:offline', { userId, lastSeen: new Date() });
        }
      } catch (err) {
        logger.error('socket disconnect cleanup failed', err);
      }
    });
  });

  return io;
}

module.exports = { initSocket, getIO: () => ioRef, userRoom };
