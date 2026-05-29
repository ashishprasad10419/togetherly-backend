const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const attachmentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['image', 'video', 'audio', 'file'], required: true },
    url: { type: String, required: true },
    publicId: String,
    name: String,
    size: Number,
    mimeType: String,
    duration: Number, // for voice/video
    width: Number,
    height: Number,
    viewOnce: { type: Boolean, default: false },
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { _id: false }
);

const pollOptionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { _id: true }
);

const messageSchema = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file', 'system', 'poll', 'location'],
      default: 'text',
    },
    content: { type: String, default: '' },
    attachments: [attachmentSchema],
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    forwardedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reactions: [reactionSchema],
    deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isDeletedForEveryone: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
    poll: {
      question: String,
      options: [pollOptionSchema],
      multipleChoice: { type: Boolean, default: false },
      closed: { type: Boolean, default: false },
    },
    location: {
      lat: Number,
      lng: Number,
      label: String, // optional place name
    },
    expiresAt: { type: Date, index: true }, // for disappearing messages
  },
  { timestamps: true }
);

messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Message', messageSchema);
