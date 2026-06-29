import express from 'express';
import {
  signup, signin, refresh, logout,
  forgotPassword, resetPassword, verifyPhone, resendOtp, getMe
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

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

export default router;
