/* WebRTC signaling relay. Actual peer connection is handled on the clients. */
module.exports = function registerCallHandlers(io, socket) {
  const userId = socket.userId;

  socket.on('call:invite', ({ chatId, toUserId, type, sdp }) => {
    io.to(`user:${toUserId}`).emit('call:incoming', {
      fromUserId: userId,
      chatId,
      type,
      sdp,
    });
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
