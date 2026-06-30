import client from '../config/twilio.js';

export async function verifyOtpService(phone, code) {
  const check = await client.verify.v2
    .services(process.env.TWILIO_SERVICE_SID)
    .verificationChecks.create({
      to: phone,
      code
    });

  return check.status === 'approved';
}
