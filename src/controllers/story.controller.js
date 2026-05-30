const Story = require('../models/Story');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { emitToChat } = require('../sockets/emitters');

const STORY_TTL_HOURS = 24;

/** POST /api/v1/stories — create a new story */
exports.create = asyncHandler(async (req, res) => {
  const { type, content, backgroundColor, media } = req.body;
  if (!['text', 'image', 'video'].includes(type)) throw ApiError.badRequest('Invalid story type');
  if (type === 'text' && !content?.trim()) throw ApiError.badRequest('Text stories need content');
  if ((type === 'image' || type === 'video') && !media?.url) throw ApiError.badRequest('Media stories need a media url');

  const story = await Story.create({
    author: req.userId,
    type,
    content: content || '',
    backgroundColor: backgroundColor || '#7B61FF',
    media: media || undefined,
    expiresAt: new Date(Date.now() + STORY_TTL_HOURS * 60 * 60 * 1000),
  });

  const populated = await story.populate('author', 'name avatar');
  res.status(201).json({ story: populated });
});

/** GET /api/v1/stories — feed visible to current user (self + contacts) */
exports.feed = asyncHandler(async (req, res) => {
  const me = await User.findById(req.userId).select('contacts');
  const visibleAuthorIds = [req.userId, ...(me.contacts || [])];

  // Group by author so the client renders a "ring" per person, in WhatsApp/IG style.
  const stories = await Story.find({
    author: { $in: visibleAuthorIds },
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .populate('author', 'name avatar');

  const byAuthor = new Map();
  for (const s of stories) {
    const key = s.author._id.toString();
    if (!byAuthor.has(key)) {
      byAuthor.set(key, {
        author: s.author,
        stories: [],
        hasUnviewed: false,
        isMine: key === req.userId,
      });
    }
    const bucket = byAuthor.get(key);
    bucket.stories.push(s);
    const viewed = s.viewers.some((v) => v.user.toString() === req.userId);
    if (!viewed && key !== req.userId) bucket.hasUnviewed = true;
  }

  // Stories per bucket are oldest-first for natural playback order
  byAuthor.forEach((b) => b.stories.reverse());

  // Mine first, then unviewed contacts, then viewed
  const buckets = Array.from(byAuthor.values()).sort((a, b) => {
    if (a.isMine && !b.isMine) return -1;
    if (b.isMine && !a.isMine) return 1;
    if (a.hasUnviewed && !b.hasUnviewed) return -1;
    if (b.hasUnviewed && !a.hasUnviewed) return 1;
    return 0;
  });

  res.json({ buckets });
});

/** POST /api/v1/stories/:id/view — mark a story as viewed by the current user */
exports.markViewed = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) throw ApiError.notFound('Story not found');
  const already = story.viewers.some((v) => v.user.toString() === req.userId);
  if (!already && story.author.toString() !== req.userId) {
    story.viewers.push({ user: req.userId, viewedAt: new Date() });
    await story.save();
  }
  res.json({ ok: true });
});

/** DELETE /api/v1/stories/:id — only author can delete */
exports.remove = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) throw ApiError.notFound('Story not found');
  if (story.author.toString() !== req.userId) throw ApiError.forbidden('Not your story');
  await story.deleteOne();
  res.json({ ok: true });
});

/** POST /api/v1/stories/:id/react — toggle an emoji reaction on a story */
exports.react = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) throw ApiError.notFound('Story not found');
  const { emoji } = req.body;
  if (!emoji) throw ApiError.badRequest('emoji required');

  const idx = story.reactions.findIndex((r) => r.user.toString() === req.userId);
  if (idx >= 0) {
    if (story.reactions[idx].emoji === emoji) story.reactions.splice(idx, 1);
    else story.reactions[idx].emoji = emoji;
  } else {
    story.reactions.push({ user: req.userId, emoji, createdAt: new Date() });
  }
  await story.save();
  res.json({ reactions: story.reactions });
});

/** POST /api/v1/stories/:id/reply — text reply, delivered as a DM */
exports.reply = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id).populate('author', '_id');
  if (!story) throw ApiError.notFound('Story not found');
  const { content } = req.body;
  if (!content?.trim()) throw ApiError.badRequest('content required');
  if (story.author._id.toString() === req.userId) throw ApiError.badRequest("Can't reply to your own story");

  // Open or reuse the 1:1 chat with the author, then send a text message there.
  const Chat = require('../models/Chat');
  let chat = await Chat.findOne({
    isGroup: false,
    participants: { $all: [req.userId, story.author._id], $size: 2 },
  });
  if (!chat) {
    chat = await Chat.create({
      isGroup: false,
      participants: [req.userId, story.author._id],
      createdBy: req.userId,
    });
  }

  const { persistMessage } = require('../services/message.service');
  const message = await persistMessage({
    chatId: chat._id,
    senderId: req.userId,
    type: 'text',
    content: `↩️ Replied to your story: ${content.trim()}`,
  });

  emitToChat(chat._id, 'message:new', { message }, req.userId);
  res.json({ ok: true, chatId: chat._id });
});

/** GET /api/v1/stories/:id/viewers — author can see who viewed */
exports.viewers = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id).populate('viewers.user', 'name avatar');
  if (!story) throw ApiError.notFound('Story not found');
  if (story.author.toString() !== req.userId) throw ApiError.forbidden('Not your story');
  res.json({ viewers: story.viewers });
});
