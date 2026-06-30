// backend/src/controllers/authController.js
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import cryptoRandomString from 'crypto-random-string';
import { query } from '../config/db.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sendOtpSms, generateOtpCode } from '../utils/twilioClient.js';
import { verifyOtp } from '../controllers/otpController.js';
import client from '../config/twilio.js';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

// A dummy hash used to run bcrypt.compare even when no user is found, so
// signin takes the same amount of time whether the email exists or not —
// prevents an attacker from telling registered emails apart from
// unregistered ones by measuring response time.
const DUMMY_HASH = '$2a$12$CwTycUXWue0Thq9StjUM0uJ8u8q8u8q8u8q8u8q8u8q8u8q8u8q8u';

async function issueOtp(userId, phoneNumber) {
  const otp = generateOtpCode();
  const otpHash = hashToken(otp);
  await query(`UPDATE phone_otp_codes SET used = TRUE WHERE user_id = $1 AND used = FALSE`, [userId]);
  await query(
    `INSERT INTO phone_otp_codes (user_id, code_hash, expires_at) VALUES ($1, $2, now() + interval '10 minutes')`,
    [userId, otpHash]
  );
  return sendOtpSms(phoneNumber, otp);
}

export async function signup(req, res) {
  const { email, password, fullName, phoneNumber, locationCountry, locationCity } = req.body;

if (!email || !password || !fullName || !phoneNumber) {
  return res.status(400).json({ error: 'All fields are required.' });
}

if (password.length < 8) {
  return res.status(400).json({ error: 'Password too short.' });
}
const normalizedEmail = normalizeEmail(email);
const normalizedPhone = phoneNumber.trim();

  try {
const existing = await query(
  `SELECT id FROM users WHERE email = $1 OR phone_number = $2`,
  [normalizedEmail, normalizedPhone]
);

if (existing.rows.length > 0) {
  return res.status(409).json({
    error: 'Email or phone already exists.'
  });
}

const passwordHash = await bcrypt.hash(password, 12);

const result = await query(
  `INSERT INTO users (
    email,
    password_hash,
    full_name,
    phone_number,
    location_country,
    location_city,
    status,
    phone_verified
  )
  VALUES ($1,$2,$3,$4,$5,$6,'pending',false)
  RETURNING id, email, full_name, phone_number, status`,
  [
    normalizedEmail,
    passwordHash,
    fullName,
    normalizedPhone,
    locationCountry || null,
    locationCity || null
  ]
);

const user = result.rows[0];


  // 2. Send OTP ONLY
  const otpResult = await issueOtp(user.id, phoneNumber);

  // 3. Return clean response (NO TOKENS)
  return res.status(201).json({
    message: otpResult?.sandbox
      ? 'Account created. Check backend console for OTP.'
      : 'Account created. OTP sent to your phone. Please verify to continue.',

    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phoneNumber: user.phone_number,
      status: user.status
    },

    requiresOtp: true
  });

} catch (err) {
  console.error('Signup error:', err);
  return res.status(500).json({
    error: 'Could not create account. Please try again.'
  });
}
}
export async function resendOtp(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

  try {
    const userResult = await query('SELECT phone_number, phone_verified FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'Account not found.' });
    if (user.phone_verified) return res.status(400).json({ error: 'Your phone number is already verified.' });

    const recent = await query(
      `SELECT id FROM phone_otp_codes WHERE user_id = $1 AND created_at > now() - interval '60 seconds'`,
      [userId]
    );
    if (recent.rows.length > 0) {
      return res.status(429).json({ error: 'Please wait a minute before requesting another code.' });
    }

    const otpResult = await issueOtp(userId, user.phone_number);
    if (!otpResult.sent) {
      return res.status(502).json({ error: 'Could not send the verification code. Please try again shortly.' });
    }

    return res.json({
      message: otpResult.sandbox
        ? 'Twilio is not configured yet — check the backend console for your verification code.'
        : 'A new verification code has been sent to your phone.'
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({ error: 'Could not resend verification code. Please try again.' });
  }
}

export async function verifyPhone(req, res) {
  const { code } = req.body;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated.' });
  if (!code) return res.status(400).json({ error: 'Verification code is required.' });

  try {
    const codeHash = hashToken(code);
    const result = await query(
      `SELECT id FROM phone_otp_codes
       WHERE user_id = $1 AND code_hash = $2 AND used = FALSE AND expires_at > now()
       ORDER BY created_at DESC LIMIT 1`,
      [userId, codeHash]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }
    await query('UPDATE phone_otp_codes SET used = TRUE WHERE id = $1', [result.rows[0].id]);
    await query('UPDATE users SET phone_verified = TRUE WHERE id = $1', [userId]);
    return res.json({ message: 'Phone number verified. You can now start buying on JEDIDA Marketplace.' });
  } catch (err) {
    console.error('Phone verification error:', err);
    return res.status(500).json({ error: 'Could not verify phone number. Please try again.' });
  }
}

// Hardened sign-in: explicitly refuses any path that isn't "a real,
// registered account with a matching password." No user record found is
// treated identically (same status code, same generic message, same
// response time) to a wrong password — so signin can never succeed, and
// can never even hint at success, for an unregistered email.
export async function signin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    const result = await query(
      `SELECT id, email, password_hash, phone_number, status
       FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    const user = result.rows[0];

    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended.' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ error: 'Account not active.' });
    }

    if (!user.phone_number) {
      return res.status(403).json({ error: 'Phone number required.' });
    }

    // 🔥 ONLY OTP HERE
    await issueOtp(user.id, user.phone_number);

    return res.json({
      requiresOtp: true,
      message: 'OTP sent successfully'
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Signin failed' });
  }
}
export async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required.' });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const stored = await query(
      `SELECT id FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2 AND revoked = FALSE AND expires_at > now()`,
      [payload.sub, tokenHash]
    );
    if (stored.rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token is invalid or expired. Please sign in again.' });
    }

    // Re-verify the user still exists and is active — a deleted/suspended
    // account can't silently keep refreshing tokens forever.
    const userResult = await query(
      `SELECT id, primary_role, is_admin, status FROM users WHERE id = $1`,
      [payload.sub]
    );
    const user = userResult.rows[0];
    if (!user || user.status === 'suspended' || user.status === 'rejected') {
      return res.status(401).json({ error: 'Account not found or inactive. Please sign in again.' });
    }

    const accessToken = signAccessToken(user);
    return res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Refresh token is invalid or expired. Please sign in again.' });
  }
}

export async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await query(`UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1`, [hashToken(refreshToken)]);
  }
  return res.json({ message: 'Signed out.' });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const normalizedEmail = normalizeEmail(email);
  const genericResponse = { message: 'If an account exists for that email, a reset link has been sent.' };

  try {
    const result = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (result.rows.length === 0) return res.json(genericResponse);

    const user = result.rows[0];
    const rawToken = cryptoRandomString({ length: 48, type: 'url-safe' });
    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '1 hour')`,
      [user.id, hashToken(rawToken)]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&uid=${user.id}`;
    console.log(`[JEDIDA] Password reset link for ${normalizedEmail}: ${resetLink}`); // replace with real email send

    return res.json(genericResponse);
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Could not process request. Please try again.' });
  }
}
export async function checkEmail(req, res) {
  const email = normalizeEmail(req.query.email);

  const result = await query(
    `SELECT id FROM users WHERE email = $1`,
    [email]
  );

  return res.json({
    exists: result.rows.length > 0
  });
}
export async function resetPassword(req, res) {
  const { uid, token, newPassword } = req.body;
  if (!uid || !token || !newPassword) {
    return res.status(400).json({ error: 'Missing reset details.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const tokenHash = hashToken(token);
    const result = await query(
      `SELECT id FROM password_reset_tokens
       WHERE user_id = $1 AND token_hash = $2 AND used = FALSE AND expires_at > now()`,
      [uid, tokenHash]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, uid]);
    await query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [result.rows[0].id]);
    await query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [uid]);

    return res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Could not reset password. Please try again.' });
  }
}

export async function getMe(req, res) {
  try {
    const result = await query(
      `SELECT id, email, full_name, phone_number, phone_verified, location_country, location_city,
              primary_role, is_admin, status, kyc_status, avatar_url, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Get me error:', err);
    return res.status(500).json({ error: 'Could not load profile.' });
  }
}
export async function verifySigninOtp(req, res) {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code required' });
  }

  try {
    // 1. Find user
    const result = await query(
      `SELECT id, email, phone_number, status
       FROM users WHERE email = $1`,
      [normalizeEmail(email)]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid request' });
    }

    // 2. VERIFY OTP DIRECTLY (NO SERVICE LAYER)
    const check = await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks.create({
        to: user.phone_number,
        code
      });

    if (check.status !== 'approved') {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // 3. check status
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ error: 'Account not active' });
    }

    // 4. issue tokens
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + interval '7 days')`,
      [user.id, hashToken(refreshToken)]
    );

    return res.json({
      message: 'Login successful',
      user,
      accessToken,
      refreshToken
    });

  } catch (err) {
    console.error('verifySigninOtp error:', err);
    return res.status(500).json({ error: 'Failed to verify OTP' });
  }
}
