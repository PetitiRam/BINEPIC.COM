import express from 'express';
import {
  signup, signin, refresh, logout,
  forgotPassword, resetPassword, verifyPhone, resendOtp, getMe
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { sendOtp } from '../controllers/otpController.js';
import { verifyOtp } from '../controllers/otpController.js';
import { verifySigninOtp } from '../controllers/authController.js';

const router = express.Router();
                            
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-phone', requireAuth, verifyPhone);
router.post('/resend-otp', requireAuth, resendOtp);
router.get('/me', requireAuth, getMe);
router.post('/signin', loginLimiter, signin);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/verify-signin-otp', verifySigninOtp);
export default router;

