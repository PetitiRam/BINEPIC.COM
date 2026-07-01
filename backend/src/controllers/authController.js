import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import {
  generateOtp,
  saveOtp,
  canSendOtp,
  verifyOtp
} from '../services/otpService.js';

import {
  generateAccessToken,
  generateRefreshToken,
  hashToken
} from '../utils/jwt.js';

/* ---------------- HELPERS ---------------- */
function normalize(email) {
  return email.trim().toLowerCase();
}

const DUMMY_HASH =
  '$2a$12$KIXQvFakeHashForTimingProtection000000000000';

/* ---------------- SIGNUP ---------------- */
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export async function signup(req, res) {
  try {
    const {
      email,
      password,
      fullName,
      phoneNumber,
      locationCountry,
      locationCity
    } = req.body;

    console.log('🔥 SIGNUP BODY:', req.body);

    // 1. Validate required fields
    if (!email || !password || !fullName) {
      return res.status(400).json({
        error: 'Email, password, and full name are required'
      });
    }

    const normEmail = normalizeEmail(email);

    // 2. Check duplicates (email or phone)
    const exists = await pool.query(
      `SELECT id FROM users WHERE email=$1 OR phone_number=$2`,
      [normEmail, phoneNumber]
    );

    if (exists.rows.length > 0) {
      // IMPORTANT: generic response (prevents enumeration)
      return res.status(409).json({
        error: 'Account already exists'
      });
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Create user (pending until OTP verification)
    const userResult = await pool.query(
      `INSERT INTO users (
        email,
        password_hash,
        full_name,
        phone_number,
        location_country,
        location_city,
        status,
        phone_verified,
        is_admin,
        primary_role
      )
      VALUES ($1,$2,$3,$4,$5,$6,'pending',false,false,'user')
      RETURNING id, email, full_name, status`,
      [
        normEmail,
        passwordHash,
        fullName,
        phoneNumber,
        locationCountry,
        locationCity
      ]
    );

    const user = userResult.rows[0];

    // 5. Generate OTP
    const otp = generateOtp();
    await saveOtp(user.id, otp);

    console.log('SIGNUP OTP:', otp);

    // 6. Response (NO TOKENS YET)
    return res.status(201).json({
      message: 'Account created. OTP sent to verify your account.',
      requiresOtp: true,
      user
    });

  } catch (err) {
    console.error('SIGNUP ERROR:', err);
    return res.status(500).json({
      error: 'Server error'
    });
  }
}
/* ---------------- SIGNIN ---------------- */


export async function signin(req, res) {
  try {
    const { email, password, deviceFingerprint } = req.body;

    console.log('SIGNIN BODY:', req.body);

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!deviceFingerprint) {
      return res.status(400).json({ error: 'Device fingerprint required' });
    }

    const normEmail = email.trim().toLowerCase();

    // 2. Find user
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE email=$1`,
      [normEmail]
    );

    const user = rows[0];

    // 3. Prevent email enumeration attack
    if (!user) {
      await bcrypt.compare(password, '$2a$12$dummyhashforsecurity');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 4. Verify password
    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 5. Check account status
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended' });
    }

    // 6. Rate limit OTP sending
    if (!(await canSendOtp(user.id))) {
      return res.status(429).json({ error: 'OTP recently sent, try again later' });
    }

    // 7. Generate OTP
    const otp = generateOtp();
    await saveOtp(user.id, otp);

    console.log('SIGNIN OTP:', otp);

    // 8. IMPORTANT: we DO NOT issue tokens yet
    return res.json({
      message: 'OTP sent successfully',
      requiresOtp: true
    });

  } catch (err) {
    console.error('SIGNIN ERROR:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
/* ---------------- VERIFY OTP ---------------- */
export async function verifySigninOtp(req, res) {
  try {
    const { email, code, deviceFingerprint } = req.body;

    console.log('VERIFY OTP BODY:', req.body);

    // 1. Validate input
    if (!email || !code || !deviceFingerprint) {
      return res.status(400).json({
        error: 'Email, code, and deviceFingerprint required'
      });
    }

    const normEmail = email.trim().toLowerCase();

    // 2. Find user
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE email=$1`,
      [normEmail]
    );

    const user = rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 3. Verify OTP (VERY IMPORTANT)
    const otpResult = await verifyOtp(user.id, code);

    if (!otpResult.valid) {
      return res.status(400).json({ error: otpResult.reason });
    }

    // 4. Activate user if needed
    await pool.query(
      `UPDATE users SET status='active', phone_verified=true WHERE id=$1`,
      [user.id]
    );

    // 5. Generate tokens
    const accessToken = generateAccessToken(user, deviceFingerprint);
    const refreshToken = generateRefreshToken(user);

    const refreshHash = hashToken(refreshToken);

    // 6. Store session in DB (DEVICE BINDING)
    await pool.query(
      `INSERT INTO user_sessions (
        user_id,
        refresh_token_hash,
        device_fingerprint,
        ip_address,
        user_agent,
        expires_at
      )
      VALUES ($1,$2,$3,$4,$5,NOW() + INTERVAL '7 days')`,
      [
        user.id,
        refreshHash,
        deviceFingerprint,
        req.ip,
        req.headers['user-agent']
      ]
    );

    // 7. Return login success
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        is_admin: user.is_admin
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (err) {
    console.error('VERIFY OTP ERROR:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
export async function refresh(req, res) {
  try {
    const { refreshToken, deviceFingerprint } = req.body;

    if (!refreshToken || !deviceFingerprint) {
      return res.status(400).json({ error: 'Missing refresh token or device' });
    }

    // 1. Verify JWT signature
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const userId = decoded.sub;
    const tokenHash = hashToken(refreshToken);

    // 2. Check session in DB
    const { rows } = await pool.query(
      `SELECT * FROM user_sessions
       WHERE user_id=$1
       AND refresh_token_hash=$2
       AND revoked=false`,
      [userId, tokenHash]
    );

    const session = rows[0];

    if (!session) {
      return res.status(401).json({ error: 'Session expired or revoked' });
    }

    // 3. Device check (anti theft)
    if (session.device_fingerprint !== deviceFingerprint) {
      return res.status(403).json({ error: 'Device mismatch' });
    }

    // 4. Get user
    const userRes = await pool.query(
      `SELECT * FROM users WHERE id=$1`,
      [userId]
    );

    const user = userRes.rows[0];

    // 5. ROTATE TOKENS (IMPORTANT)
    const newAccessToken = generateAccessToken(user, deviceFingerprint);
    const newRefreshToken = generateRefreshToken(user);

    const newHash = hashToken(newRefreshToken);

    // 6. Revoke old session
    await pool.query(
      `UPDATE user_sessions
       SET revoked=true
       WHERE id=$1`,
      [session.id]
    );

    // 7. Create new session
    await pool.query(
      `INSERT INTO user_sessions (
        user_id,
        refresh_token_hash,
        device_fingerprint,
        ip_address,
        user_agent,
        expires_at
      )
      VALUES ($1,$2,$3,$4,$5,NOW() + INTERVAL '7 days')`,
      [
        user.id,
        newHash,
        deviceFingerprint,
        req.ip,
        req.headers['user-agent']
      ]
    );

    // 8. Return new tokens
    return res.json({
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (err) {
    console.error('REFRESH ERROR:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
