const Call = require('../models/Call');
const asyncHandler = require('../utils/asyncHandler');

exports.history = asyncHandler(async (req, res) => {
  const calls = await Call.find({ participants: req.userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('caller', 'name avatar')
    .populate('participants', 'name avatar');
  res.json({ calls });
});

exports.log = asyncHandler(async (req, res) => {
  const { chat, participants, type, status, duration, endedAt } = req.body;
  const call = await Call.create({
    chat,
    caller: req.userId,
    participants,
    type,
    status,
    duration,
    endedAt,
  });
  res.status(201).json({ call });
});
