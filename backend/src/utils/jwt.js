import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET?.trim();
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET?.trim();

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT secrets missing in environment');
}
export function generateAccessToken(user) {
  if (!user?.id) throw new Error('generateAccessToken: user.id missing');

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      is_admin: user.is_admin,
      primary_role: user.primary_role
    },
    ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

export function generateRefreshToken(user) {
  if (!user?.id) throw new Error('generateRefreshToken: user.id missing');

  const token = jwt.sign(
    { sub: user.id },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  if (!token) throw new Error('refresh token generation failed');

  return token;
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}
export function hashToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('hashToken received invalid token');
  }

  return crypto.createHash('sha256').update(token).digest('hex');
}

