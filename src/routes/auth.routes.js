const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const v = require('../validators/auth.validator');

router.post('/signup', authLimiter, validate(v.signupSchema), ctrl.signup);
router.post('/login', authLimiter, validate(v.loginSchema), ctrl.login);
router.post('/refresh', validate(v.refreshSchema), ctrl.refresh);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.me);

router.post('/otp/request', authLimiter, validate(v.requestOtpSchema), ctrl.requestOtp);
router.post('/otp/verify', authLimiter, validate(v.verifyOtpSchema), ctrl.verifyOtpHandler);
router.post('/password/reset', authLimiter, validate(v.resetPasswordSchema), ctrl.resetPassword);

module.exports = router;
