const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const ctrl = require('../controllers/story.controller');

router.use(authenticate);

router.get('/', ctrl.feed);
router.post('/', ctrl.create);
router.post('/:id/view', ctrl.markViewed);
router.get('/:id/viewers', ctrl.viewers);
router.delete('/:id', ctrl.remove);

module.exports = router;
