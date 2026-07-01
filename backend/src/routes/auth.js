import express from 'express';
import {
  signup,
  signin,
  verifySigninOtp,
  refresh
} from '../controllers/authController.js';
                 
const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/verify-signin-otp', verifySigninOtp);
router.post('/refresh', refresh);

export default router;
