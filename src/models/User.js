const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true, index: true, sparse: true },
    password: { type: String, required: true, select: false, minlength: 8 },
    avatar: { type: String, default: '' },
    bio: { type: String, default: 'Hey there! I am using Togetherly.', maxlength: 160 },
    lastSeen: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    blocked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pinnedChats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }],
    privacy: {
      lastSeen: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
      profilePhoto: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
      readReceipts: { type: Boolean, default: true },
    },
    notificationsEnabled: { type: Boolean, default: true },
    pushTokens: [{ type: String }],
    refreshTokens: { type: [String], select: false, default: [] },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

// Hide soft-deleted users from default find()s
userSchema.pre(/^find/, function () {
  if (!this.getOptions().withDeleted) {
    this.where({ deletedAt: null });
  }
});

userSchema.index({ name: 'text', email: 'text' });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, env.bcryptRounds);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
