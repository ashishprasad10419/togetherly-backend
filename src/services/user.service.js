const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Call = require('../models/Call');

/**
 * Hard-delete a user and everything that references them — chats (1:1 deleted,
 * groups detached), messages, calls, contact references on other users.
 * Use sparingly; in production you'd typically prefer a soft-delete flag.
 */
async function deleteUserCascade(userId) {
  const user = await User.findById(userId);
  if (!user) return { ok: false, reason: 'User not found' };

  const id = user._id;

  // 1) Chats: drop 1:1 chats entirely (and their messages); detach from groups
  const chats = await Chat.find({ participants: id });
  const droppedChatIds = [];
  for (const c of chats) {
    if (!c.isGroup && c.participants.length === 2) {
      await Message.deleteMany({ chat: c._id });
      await c.deleteOne();
      droppedChatIds.push(c._id);
    } else {
      c.participants = c.participants.filter((p) => p.toString() !== id.toString());
      c.admins = c.admins.filter((p) => p.toString() !== id.toString());
      await c.save();
    }
  }

  // 2) Calls: delete any call where the user was caller OR a participant
  const callResult = await Call.deleteMany({
    $or: [{ caller: id }, { participants: id }],
  });

  // 3) Sweep other users' contact/blocked/pinnedChats arrays
  await User.updateMany(
    {},
    {
      $pull: {
        contacts: id,
        blocked: id,
        pinnedChats: { $in: droppedChatIds },
      },
    }
  );

  // 4) Finally, delete the user
  await user.deleteOne();

  return {
    ok: true,
    deleted: {
      user: id.toString(),
      droppedChats: droppedChatIds.length,
      deletedCalls: callResult.deletedCount || 0,
    },
  };
}

module.exports = { deleteUserCascade };
