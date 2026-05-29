const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const attachment = Joi.object({
  type: Joi.string().valid('image', 'video', 'audio', 'file').required(),
  url: Joi.string().uri().required(),
  publicId: Joi.string().optional(),
  name: Joi.string().optional(),
  size: Joi.number().optional(),
  mimeType: Joi.string().optional(),
  duration: Joi.number().optional(),
  width: Joi.number().optional(),
  height: Joi.number().optional(),
});

exports.sendMessageSchema = Joi.object({
  chatId: objectId.required(),
  type: Joi.string().valid('text', 'image', 'video', 'audio', 'file').default('text'),
  content: Joi.string().allow('').max(4096),
  attachments: Joi.array().items(attachment).default([]),
  replyTo: objectId.optional(),
  forwardedFrom: objectId.optional(),
}).or('content', 'attachments');

exports.forwardSchema = Joi.object({
  messageId: objectId.required(),
  chatIds: Joi.array().items(objectId).min(1).required(),
});

exports.reactSchema = Joi.object({
  emoji: Joi.string().min(1).max(8).required(),
});
