const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateCustomer } = require('../middleware/authMiddleware');
const { otpRateLimiter, otpVerifyLimiter } = require('../middleware/rateLimiter');

// Public customer Mobile + Password authentication
router.post('/register', authController.registerCustomer);
router.post('/login', authController.loginCustomer);
router.post('/forgot-password/verify-mobile', authController.verifyForgotPasswordMobile);
router.post('/forgot-password/change', authController.changePasswordDirect);
router.post('/forgot-password/request', otpRateLimiter, authController.requestForgotPassword);
router.post('/forgot-password/reset', otpVerifyLimiter, authController.resetForgotPassword);

// Public customer OTP authentication
router.post('/send-otp', otpRateLimiter, authController.sendOtp);
router.post('/verify-otp', otpVerifyLimiter, authController.verifyOtp);

// Protected customer routes
router.get('/me', authenticateCustomer, authController.getMe);
router.put('/profile', authenticateCustomer, authController.updateProfile);
router.post('/logout', authenticateCustomer, authController.logout);

module.exports = router;
