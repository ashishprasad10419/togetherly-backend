const { Expo } = require('expo-server-sdk');
const User = require('../models/User');
const logger = require('../utils/logger');

const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN, // optional; only needed for >600 msgs/sec
  useFcmV1: true,
});

/**
 * Dispatch a push notification to the given user IDs.
 * Silently no-ops for tokens that are invalid (e.g. user uninstalled).
 */
async function pushToUsers(userIds, { title, body, data }) {
  if (!userIds?.length) return;
  const users = await User.find({
    _id: { $in: userIds },
    notificationsEnabled: { $ne: false },
    pushTokens: { $exists: true, $ne: [] },
  }).select('pushTokens');

  const messages = [];
  const tokenToUser = new Map();
  for (const u of users) {
    for (const token of u.pushTokens) {
      if (!Expo.isExpoPushToken(token)) continue;
      tokenToUser.set(token, u._id);
      messages.push({
        to: token,
        sound: 'default',
        title,
        body,
        data: data || {},
        priority: 'high',
        channelId: 'default',
      });
    }
  }
  if (!messages.length) return;

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  for (const chunk of chunks) {
    try {
      const t = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...t);
    } catch (err) {
      logger.warn('push send chunk failed', err.message);
    }
  }

  // Drop tokens reported as DeviceNotRegistered so we stop hitting them
  const deadTokens = [];
  tickets.forEach((ticket, i) => {
    if (ticket.status === 'error') {
      const code = ticket.details?.error;
      const token = messages[i]?.to;
      if (code === 'DeviceNotRegistered' && token) deadTokens.push(token);
    }
  });
  if (deadTokens.length) {
    await User.updateMany({ pushTokens: { $in: deadTokens } }, { $pull: { pushTokens: { $in: deadTokens } } });
    logger.info(`Pruned ${deadTokens.length} dead push tokens`);
  }
}

module.exports = { pushToUsers };
