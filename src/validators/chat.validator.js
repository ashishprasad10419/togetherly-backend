const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

exports.createChatSchema = Joi.object({
  userId: objectId.required(),
});

exports.createGroupSchema = Joi.object({
  name: Joi.string().trim().min(1).max(60).required(),
  participants: Joi.array().items(objectId).min(1).required(),
  avatar: Joi.string().uri().optional(),
  description: Joi.string().max(300).optional(),
});

exports.updateGroupSchema = Joi.object({
  name: Joi.string().trim().min(1).max(60).optional(),
  description: Joi.string().max(300).optional(),
  avatar: Joi.string().uri().optional(),
});

exports.addParticipantsSchema = Joi.object({
  participants: Joi.array().items(objectId).min(1).required(),
});
