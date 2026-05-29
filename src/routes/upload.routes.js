const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const ctrl = require('../controllers/upload.controller');

router.use(authenticate);

router.post('/single', upload.single('file'), ctrl.uploadSingle);
router.post('/many', upload.array('files', 10), ctrl.uploadMany);

module.exports = router;
