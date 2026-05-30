const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['text', 'image', 'video'], required: true },
    content: { type: String, default: '' }, // text content or caption
    backgroundColor: { type: String, default: '#7B61FF' }, // for text stories
    media: {
      url: String,
      publicId: String,
      mimeType: String,
      width: Number,
      height: Number,
      duration: Number,
    },
    viewers: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, viewedAt: Date }],
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// TTL — Mongo auto-deletes expired stories
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Story', storySchema);
