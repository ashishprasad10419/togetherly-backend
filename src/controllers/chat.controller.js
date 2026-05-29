const Chat = require('../models/Chat');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

exports.listChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ participants: req.userId })
    .sort({ lastMessageAt: -1 })
    .populate('participants', 'name avatar isOnline lastSeen')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'name avatar' },
    });
  res.json({ chats });
});

exports.getOrCreateOneToOne = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (userId === req.userId) throw ApiError.badRequest("Can't chat with yourself");

  const target = await User.findById(userId);
  if (!target) throw ApiError.notFound('User not found');

  let chat = await Chat.findOne({
    isGroup: false,
    participants: { $all: [req.userId, userId], $size: 2 },
  }).populate('participants', 'name avatar isOnline lastSeen');

  if (!chat) {
    chat = await Chat.create({
      isGroup: false,
      participants: [req.userId, userId],
      createdBy: req.userId,
    });
    chat = await chat.populate('participants', 'name avatar isOnline lastSeen');
  }

  res.json({ chat });
});

exports.getChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.id, participants: req.userId })
    .populate('participants', 'name avatar isOnline lastSeen')
    .populate('admins', 'name avatar');
  if (!chat) throw ApiError.notFound('Chat not found');
  res.json({ chat });
});

exports.createGroup = asyncHandler(async (req, res) => {
  const { name, participants, avatar, description } = req.body;
  const uniqueParticipants = Array.from(new Set([...participants, req.userId]));

  const chat = await Chat.create({
    isGroup: true,
    name,
    avatar,
    description,
    participants: uniqueParticipants,
    admins: [req.userId],
    createdBy: req.userId,
  });

  const populated = await chat.populate('participants', 'name avatar isOnline lastSeen');
  res.status(201).json({ chat: populated });
});

exports.updateGroup = asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.id, isGroup: true });
  if (!chat) throw ApiError.notFound('Group not found');
  if (!chat.admins.some((id) => id.toString() === req.userId)) {
    throw ApiError.forbidden('Only admins can update the group');
  }
  Object.assign(chat, req.body);
  await chat.save();
  res.json({ chat });
});

exports.addParticipants = asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.id, isGroup: true });
  if (!chat) throw ApiError.notFound('Group not found');
  if (!chat.admins.some((id) => id.toString() === req.userId)) {
    throw ApiError.forbidden('Only admins can add participants');
  }
  const { participants } = req.body;
  participants.forEach((p) => {
    if (!chat.participants.some((id) => id.toString() === p)) chat.participants.push(p);
  });
  await chat.save();
  res.json({ chat });
});

exports.removeParticipant = asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.id, isGroup: true });
  if (!chat) throw ApiError.notFound('Group not found');
  const targetId = req.params.userId;
  if (targetId !== req.userId && !chat.admins.some((id) => id.toString() === req.userId)) {
    throw ApiError.forbidden('Only admins can remove participants');
  }
  chat.participants = chat.participants.filter((id) => id.toString() !== targetId);
  chat.admins = chat.admins.filter((id) => id.toString() !== targetId);
  await chat.save();
  res.json({ chat });
});

exports.togglePin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  const chatId = req.params.id;
  const exists = user.pinnedChats.some((id) => id.toString() === chatId);
  user.pinnedChats = exists
    ? user.pinnedChats.filter((id) => id.toString() !== chatId)
    : [...user.pinnedChats, chatId];
  await user.save();
  res.json({ pinned: !exists });
});
