// otpService.js
import client from '../config/twilio.js';

// fallback store (ONLY for dev if Twilio fails)
const otpStore = new Map();

export async function sendOtp(phone) {
  try {
    const code = Math.floor(100000 + Math.random() * 900000);

    // store fallback
    otpStore.set(phone, {
      code: String(code),
      expires: Date.now() + 5 * 60 * 1000
    });

    // TRY TWILIO
    await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verifications.create({
        to: phone,
        channel: 'sms'
      });

    return { sent: true, sandbox: false };

  } catch (err) {
    console.log("Twilio failed, using fallback OTP");

    return {
      sent: true,
      sandbox: true,
      code // show in console
    };
  }
}

export async function verifyOtp(phone, code) {
  // 1. Try Twilio first
  try {
    const check = await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks.create({
        to: phone,
        code
      });

    if (check.status === 'approved') {
      return { valid: true };
    }
  } catch (e) {}

  // 2. fallback check
  const record = otpStore.get(phone);

  if (!record) return { valid: false, message: "No OTP found" };

  if (Date.now() > record.expires) {
    otpStore.delete(phone);
    return { valid: false, message: "OTP expired" };
  }

  if (record.code !== code) {
    return { valid: false, message: "Invalid OTP" };
  }

  otpStore.delete(phone);
  return { valid: true };
}
