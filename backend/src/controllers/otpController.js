import client from '../config/twilio.js';

/**
 * STEP 1: SEND OTP (Twilio)
 */
export async function sendOtp(req, res) {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verifications.create({
        to: phone,
        channel: 'sms'
      });

    return res.json({
      success: true,
      message: 'OTP sent successfully',
      status: verification.status
    });

  } catch (err) {
    console.error('Send OTP error:', err);
    return res.status(500).json({
      error: 'Failed to send OTP'
    });
  }
}

/**
 * STEP 2: VERIFY OTP (Twilio)
 */
export async function verifyOtp(req, res) {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code are required' });
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
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (err) {
    console.error('OTP verify error:', err);
    return res.status(500).json({
      error: 'OTP verification failed'
    });
  }
}
