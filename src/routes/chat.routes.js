const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/chat.controller');
const v = require('../validators/chat.validator');

router.use(authenticate);

router.get('/', ctrl.listChats);
router.post('/one-to-one', validate(v.createChatSchema), ctrl.getOrCreateOneToOne);
router.post('/groups', validate(v.createGroupSchema), ctrl.createGroup);
router.get('/:id', ctrl.getChat);
router.put('/:id', validate(v.updateGroupSchema), ctrl.updateGroup);
router.post('/:id/participants', validate(v.addParticipantsSchema), ctrl.addParticipants);
router.delete('/:id/participants/:userId', ctrl.removeParticipant);
router.post('/:id/pin', ctrl.togglePin);

module.exports = router;
