const Call = require('../models/Call');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Returns the ICE server list the client should use for WebRTC.
 * STUN is always included; TURN is added if configured via env vars.
 *
 * Metered.ca free tier example:
 *   TURN_URLS="turn:standard.relay.metered.ca:80,turn:standard.relay.metered.ca:443,turns:standard.relay.metered.ca:443"
 *   TURN_USERNAME="..."
 *   TURN_CREDENTIAL="..."
 */
exports.iceServers = asyncHandler(async (_req, res) => {
  const servers = [{ urls: 'stun:stun.l.google.com:19302' }];
  if (process.env.TURN_URLS && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
    const urls = process.env.TURN_URLS.split(',').map((s) => s.trim()).filter(Boolean);
    servers.push({
      urls,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_CREDENTIAL,
    });
  }
  res.set('Cache-Control', 'no-store');
  res.json({ iceServers: servers });
});

exports.history = asyncHandler(async (req, res) => {
  const calls = await Call.find({ participants: req.userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('caller', 'name avatar')
    .populate('participants', 'name avatar');

  // Skip records whose caller has been deleted, and prune any null participants
  // (defensive against stale references). The client can safely render the rest.
  const safe = calls
    .filter((c) => !!c.caller)
    .map((c) => {
      const obj = c.toObject();
      obj.participants = (obj.participants || []).filter(Boolean);
      return obj;
    });

  res.json({ calls: safe });
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
