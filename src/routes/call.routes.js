const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const ctrl = require('../controllers/call.controller');

router.use(authenticate);

router.get('/', ctrl.history);
router.post('/', ctrl.log);
router.get('/ice-servers', ctrl.iceServers);

module.exports = router;
