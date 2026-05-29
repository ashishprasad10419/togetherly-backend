const router = require('express').Router();
const adminOnly = require('../middlewares/admin');
const ctrl = require('../controllers/admin.controller');

router.use(adminOnly);

router.get('/stats', ctrl.stats);
router.get('/users', ctrl.listUsers);
router.delete('/users/:id', ctrl.deleteUser);
router.get('/audit', ctrl.listAudit);

module.exports = router;
