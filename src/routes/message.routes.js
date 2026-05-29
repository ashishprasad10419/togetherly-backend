const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/message.controller');
const v = require('../validators/message.validator');

router.use(authenticate);

router.get('/search', ctrl.search);
router.get('/:chatId', ctrl.listMessages);
router.post('/', validate(v.sendMessageSchema), ctrl.send);
router.post('/:chatId/read', ctrl.markRead);
router.delete('/:id/me', ctrl.deleteForMe);
router.delete('/:id', ctrl.deleteForEveryone);
router.post('/forward', validate(v.forwardSchema), ctrl.forward);
router.post('/:id/react', validate(v.reactSchema), ctrl.react);

module.exports = router;
