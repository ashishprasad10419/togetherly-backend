const Joi = require('joi');

exports.signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).required(),
  email: Joi.string().email().lowercase().trim().required(),
  phone: Joi.string().trim().min(6).max(20).optional(),
  password: Joi.string().min(8).max(128).required(),
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required(),
});

exports.refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

exports.requestOtpSchema = Joi.object({
  identifier: Joi.string().required(),
  purpose: Joi.string().valid('verify', 'reset').required(),
});

exports.verifyOtpSchema = Joi.object({
  identifier: Joi.string().required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required(),
  purpose: Joi.string().valid('verify', 'reset').required(),
});

exports.resetPasswordSchema = Joi.object({
  identifier: Joi.string().required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required(),
  newPassword: Joi.string().min(8).max(128).required(),
});
