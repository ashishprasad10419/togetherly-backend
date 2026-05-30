const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/chats', require('./chat.routes'));
router.use('/messages', require('./message.routes'));
router.use('/uploads', require('./upload.routes'));
router.use('/calls', require('./call.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/stories', require('./story.routes'));
router.use('/scheduled', require('./scheduled.routes'));

module.exports = router;
