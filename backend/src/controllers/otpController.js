import client from '../config/twilio.js';

export async function sendOtp(req, res) {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number required' });
  }

  try {
    await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verifications.create({
        to: phone,
        channel: 'sms'
      });

    return res.json({
      message: 'OTP sent successfully'
    });

  } catch (err) {
    console.error('OTP send error:', err);
    return res.status(500).json({
      error: 'Failed to send OTP'
    });
  }
}
export async function verifyOtp(req, res) {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code required' });
  }

  try {
    const check = await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks.create({
        to: phone,
        code
      });

    if (check.status !== 'approved') {
      return res.status(401).json({
        error: 'Invalid or expired OTP'
      });
    }

    return res.json({
      message: 'OTP verified successfully'
    });

  } catch (err) {
    console.error('OTP verify error:', err);
    return res.status(500).json({
      error: 'OTP verification failed'
    });
  }
}
