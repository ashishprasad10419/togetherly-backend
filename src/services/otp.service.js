const bcrypt = require('bcryptjs');
const Otp = require('../models/Otp');
const env = require('../config/env');
const logger = require('../utils/logger');

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createOtp(identifier, purpose) {
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 8);
  const expiresAt = new Date(Date.now() + env.otpTtl * 1000);

  // Invalidate any pending OTPs for the same identifier+purpose
  await Otp.deleteMany({ identifier, purpose, consumed: false });
  await Otp.create({ identifier, purpose, codeHash, expiresAt });

  // In production: dispatch via Twilio/SendGrid here.
  if (env.nodeEnv !== 'production') {
    logger.info(`[OTP] ${identifier} (${purpose}) → ${code}`);
  }
  return { sent: true, devCode: env.nodeEnv !== 'production' ? code : undefined };
}

async function verifyOtp(identifier, code, purpose) {
  const record = await Otp.findOne({ identifier, purpose, consumed: false }).sort({ createdAt: -1 });
  if (!record) return false;
  if (record.expiresAt < new Date()) return false;
  const ok = await bcrypt.compare(code, record.codeHash);
  if (!ok) return false;
  record.consumed = true;
  await record.save();
  return true;
}

module.exports = { createOtp, verifyOtp };
