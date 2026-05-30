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
  viewOnce: Joi.boolean().optional(),
});

const poll = Joi.object({
  question: Joi.string().min(1).max(280).required(),
  options: Joi.array()
    .items(Joi.object({ text: Joi.string().min(1).max(80).required() }))
    .min(2)
    .max(10)
    .required(),
  multipleChoice: Joi.boolean().optional(),
});

const location = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  label: Joi.string().max(120).optional(),
});

exports.sendMessageSchema = Joi.object({
  chatId: objectId.required(),
  type: Joi.string().valid('text', 'image', 'video', 'audio', 'file', 'poll', 'location').default('text'),
  content: Joi.string().allow('').max(4096),
  attachments: Joi.array().items(attachment).default([]),
  replyTo: objectId.optional(),
  forwardedFrom: objectId.optional(),
  poll: poll.optional(),
  location: location.optional(),
}).or('content', 'attachments', 'poll', 'location');

exports.votePollSchema = Joi.object({
  optionId: objectId.required(),
});

exports.disappearingSchema = Joi.object({
  seconds: Joi.number().integer().min(0).max(7 * 24 * 60 * 60).required(),
});

exports.forwardSchema = Joi.object({
  messageId: objectId.required(),
  chatIds: Joi.array().items(objectId).min(1).required(),
});

exports.reactSchema = Joi.object({
  emoji: Joi.string().min(1).max(8).required(),
});

exports.editSchema = Joi.object({
  content: Joi.string().min(1).max(4096).required(),
});

exports.scheduleSchema = Joi.object({
  chatId: objectId.required(),
  content: Joi.string().min(1).max(4096).required(),
  sendAt: Joi.date().iso().greater('now').required(),
});
