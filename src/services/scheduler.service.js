const ScheduledMessage = require('../models/ScheduledMessage');
const { persistMessage } = require('./message.service');
const { emitToChat } = require('../sockets/emitters');
const logger = require('../utils/logger');

let started = false;

/**
 * Lightweight in-process scheduler. Every 30 seconds it scans for scheduled
 * messages whose sendAt has passed, persists them as real messages, broadcasts
 * to the chat room, and marks the scheduled record as delivered.
 *
 * Trade-offs (and why it's good enough for this app's scale):
 *   - Single-instance only. If we scale Render to multiple workers, switch to
 *     a Redis-backed queue (BullMQ) so jobs aren't double-processed.
 *   - 30s granularity. Users can't schedule to-the-second precision.
 */
function startScheduler() {
  if (started) return;
  started = true;

  const tick = async () => {
    try {
      const due = await ScheduledMessage.find({
        sendAt: { $lte: new Date() },
        delivered: false,
      }).limit(50);

      for (const job of due) {
        try {
          const message = await persistMessage({
            chatId: job.chat,
            senderId: job.sender,
            type: 'text',
            content: job.content,
          });
          job.delivered = true;
          job.deliveredMessage = message._id;
          await job.save();
          emitToChat(job.chat, 'message:new', { message }, job.sender.toString());
          logger.info(`Scheduled message ${job._id} delivered`);
        } catch (err) {
          logger.error(`Scheduled message ${job._id} failed`, err.message);
        }
      }
    } catch (err) {
      logger.warn('scheduler tick failed', err.message);
    }
  };

  // First tick after startup gives Mongo a moment to settle.
  setTimeout(tick, 5_000);
  setInterval(tick, 30_000);

  logger.info('Scheduler started (30s tick)');
}

module.exports = { startScheduler };
