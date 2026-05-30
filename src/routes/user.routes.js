const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/user.controller');
const v = require('../validators/user.validator');

router.use(authenticate);

router.get('/search', ctrl.search);
router.get('/contacts', ctrl.contacts);
router.post('/contacts', validate(v.blockSchema), ctrl.addContact);
router.delete('/contacts/:id', ctrl.removeContact);

router.put('/me', validate(v.updateProfileSchema), ctrl.updateProfile);
router.put('/me/privacy', validate(v.privacySchema), ctrl.updatePrivacy);

router.post('/block', validate(v.blockSchema), ctrl.block);
router.delete('/block/:id', ctrl.unblock);

router.post('/push-tokens', validate(v.pushTokenSchema), ctrl.registerPushToken);
router.delete('/push-tokens', validate(v.pushTokenSchema), ctrl.unregisterPushToken);

router.post('/public-key', ctrl.registerPublicKey);
router.get('/:id/public-key', ctrl.getPublicKey);

router.get('/:id', ctrl.getById);

module.exports = router;
