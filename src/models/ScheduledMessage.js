const mongoose = require('mongoose');

const scheduledSchema = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, maxlength: 4096 },
    sendAt: { type: Date, required: true, index: true },
    delivered: { type: Boolean, default: false, index: true },
    deliveredMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  },
  { timestamps: true }
);

scheduledSchema.index({ sendAt: 1, delivered: 1 });

module.exports = mongoose.model('ScheduledMessage', scheduledSchema);
