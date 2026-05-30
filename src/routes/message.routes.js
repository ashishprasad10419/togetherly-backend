const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/message.controller');
const v = require('../validators/message.validator');
const { writeLimiter } = require('../middlewares/rateLimiter');

router.use(authenticate);

router.get('/search', ctrl.search);
router.get('/:chatId', ctrl.listMessages);
router.post('/', writeLimiter, validate(v.sendMessageSchema), ctrl.send);
router.post('/:chatId/read', ctrl.markRead);
router.delete('/:id/me', ctrl.deleteForMe);
router.delete('/:id', ctrl.deleteForEveryone);
router.post('/forward', validate(v.forwardSchema), ctrl.forward);
router.post('/:id/react', validate(v.reactSchema), ctrl.react);
router.post('/:id/vote', validate(v.votePollSchema), ctrl.votePoll);
router.post('/:id/view-once', ctrl.markViewOnce);
router.patch('/:id', validate(v.editSchema), ctrl.edit);

module.exports = router;
