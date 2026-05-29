const mongoose = require('mongoose');

const callSchema = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', index: true },
    caller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    type: { type: String, enum: ['audio', 'video'], required: true },
    status: {
      type: String,
      enum: ['ringing', 'ongoing', 'ended', 'missed', 'declined'],
      default: 'ringing',
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    duration: { type: Number, default: 0 }, // seconds
  },
  { timestamps: true }
);

callSchema.index({ participants: 1, createdAt: -1 });

module.exports = mongoose.model('Call', callSchema);
