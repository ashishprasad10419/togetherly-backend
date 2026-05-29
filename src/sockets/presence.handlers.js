const User = require('../models/User');

module.exports = function registerPresenceHandlers(io, socket) {
  socket.on('presence:ping', async () => {
    await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date(), isOnline: true });
  });
};
