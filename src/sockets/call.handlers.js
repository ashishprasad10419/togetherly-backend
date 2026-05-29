/* WebRTC signaling relay. Actual peer connection is handled on the clients. */
const User = require('../models/User');
const { pushToUsers } = require('../services/push.service');

module.exports = function registerCallHandlers(io, socket) {
  const userId = socket.userId;

  socket.on('call:invite', async ({ chatId, toUserId, type, sdp }) => {
    io.to(`user:${toUserId}`).emit('call:incoming', {
      fromUserId: userId,
      chatId,
      type,
      sdp,
    });
    // Also push, in case the callee's app is closed.
    try {
      const caller = await User.findById(userId).select('name');
      await pushToUsers([toUserId], {
        title: `Incoming ${type} call`,
        body: `${caller?.name || 'Someone'} is calling`,
        data: { type: 'call', fromUserId: userId, callType: type },
      });
    } catch {
      /* ignore */
    }
  });

  socket.on('call:accept', ({ toUserId, sdp }) => {
    io.to(`user:${toUserId}`).emit('call:accepted', { fromUserId: userId, sdp });
  });

  socket.on('call:decline', ({ toUserId, reason }) => {
    io.to(`user:${toUserId}`).emit('call:declined', { fromUserId: userId, reason });
  });

  socket.on('call:ice', ({ toUserId, candidate }) => {
    io.to(`user:${toUserId}`).emit('call:ice', { fromUserId: userId, candidate });
  });

  socket.on('call:end', ({ toUserId }) => {
    io.to(`user:${toUserId}`).emit('call:ended', { fromUserId: userId });
  });
};
