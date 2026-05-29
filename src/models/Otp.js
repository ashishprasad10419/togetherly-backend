const mongoose = require('mongoose');
const env = require('../config/env');

const otpSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true, index: true }, // email or phone
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ['verify', 'reset'], required: true },
    expiresAt: { type: Date, required: true },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// TTL — Mongo will purge expired docs automatically
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.statics.ttlSeconds = () => env.otpTtl;

module.exports = mongoose.model('Otp', otpSchema);
