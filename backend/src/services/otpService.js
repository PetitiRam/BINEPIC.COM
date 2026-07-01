import crypto from 'crypto';
import { pool } from '../config/db.js';

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN = 60;

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashOtp(otp) {
  if (!otp || typeof otp !== 'string') {
    throw new Error(`Invalid OTP passed to hashOtp: ${otp}`);
  }

  return crypto.createHash('sha256').update(otp).digest('hex');
}

/* ---------------- RATE LIMIT ---------------- */
export async function canSendOtp(userId) {
  const { rows } = await pool.query(
    `SELECT created_at
     FROM phone_otp_codes
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (!rows.length) return true;

  const diff = (Date.now() - new Date(rows[0].created_at)) / 1000;
  return diff >= RESEND_COOLDOWN;
}

/* ---------------- SAVE OTP ---------------- */
export async function saveOtp(userId, otp) {
if (!otp) {
  return { valid: false, reason: 'OTP missing from request' };
} 

 const codeHash = hashOtp(otp);

  await pool.query(
    `INSERT INTO phone_otp_codes (user_id, code_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '${OTP_EXPIRY_MINUTES} minutes')`,
    [userId, codeHash]
  );
}

/* ---------------- VERIFY OTP ---------------- */
export async function verifyOtp(userId, otp) {
  const codeHash = hashOtp(otp);

  const { rows } = await pool.query(
    `SELECT * FROM phone_otp_codes
     WHERE user_id = $1
     AND used = FALSE
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (!rows.length) return { valid: false, reason: 'OTP not found' };

  const record = rows[0];

  if (record.attempts >= MAX_ATTEMPTS)
    return { valid: false, reason: 'OTP locked' };

  if (new Date(record.expires_at) < new Date())
    return { valid: false, reason: 'OTP expired' };

  if (record.code_hash !== codeHash) {
    await pool.query(
      `UPDATE phone_otp_codes SET attempts = attempts + 1 WHERE id = $1`,
      [record.id]
    );

    return { valid: false, reason: 'Invalid OTP' };
  }

  await pool.query(
    `UPDATE phone_otp_codes SET used = TRUE WHERE id = $1`,
    [record.id]
  );

  return { valid: true };
}
