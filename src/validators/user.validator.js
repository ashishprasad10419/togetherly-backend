const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

exports.updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).optional(),
  bio: Joi.string().max(160).allow('').optional(),
  avatar: Joi.string().uri().optional(),
  phone: Joi.string().trim().min(6).max(20).optional(),
});

exports.privacySchema = Joi.object({
  lastSeen: Joi.string().valid('everyone', 'contacts', 'nobody').optional(),
  profilePhoto: Joi.string().valid('everyone', 'contacts', 'nobody').optional(),
  readReceipts: Joi.boolean().optional(),
});

exports.blockSchema = Joi.object({
  userId: objectId.required(),
});

exports.pushTokenSchema = Joi.object({
  token: Joi.string().required(),
});
