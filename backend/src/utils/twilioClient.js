// Thin wrapper around the Twilio SDK so the rest of the app never imports
// 'twilio' directly. Falls back to a console-logged "sandbox" send when
// Twilio credentials aren't configured, so signup still works in local dev
// without a Twilio account.

import twilio from 'twilio';

let client = null;
function getClient() {
  if (client) return client;
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return client;
}

/**
 * Sends a 6-digit OTP code to `toPhoneNumber` via Twilio SMS.
 * Returns { sent: boolean, sandbox: boolean, sid?: string }.
 */
export async function sendOtpSms(toPhoneNumber, otpCode) {
  const twilioClient = getClient();
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!twilioClient || !from) {
    console.log(`[JEDIDA][SANDBOX SMS] OTP for ${toPhoneNumber}: ${otpCode} (Twilio not configured — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in .env to send real SMS)`);
    return { sent: true, sandbox: true };
  }

  try {
    const message = await twilioClient.messages.create({
      body: `Your JEDIDA Marketplace verification code is ${otpCode}. It expires in 10 minutes.`,
      from,
      to: toPhoneNumber
    });
    return { sent: true, sandbox: false, sid: message.sid };
  } catch (err) {
    console.error('Twilio SMS send error:', err.message);
    return { sent: false, sandbox: false, error: err.message };
  }
}

export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
