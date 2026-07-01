import { generateOtp, saveOtp, canSendOtp } from '../services/otpService.js';

export async function sendOtp(req, res) {
  try {
    const { userId } = req.body;

    if (!(await canSendOtp(userId))) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    const otp = generateOtp();
    await saveOtp(userId, otp);

    console.log('OTP:', otp);

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
