const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    isGroup: { type: Boolean, default: false },
    name: { type: String, trim: true },
    avatar: { type: String, default: '' },
    description: { type: String, default: '', maxlength: 300 },
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    // Per-user unread counters: { userId: count }
    unread: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);
