const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/scheduled.controller');
const v = require('../validators/message.validator');

router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', validate(v.scheduleSchema), ctrl.create);
router.delete('/:id', ctrl.cancel);

module.exports = router;
