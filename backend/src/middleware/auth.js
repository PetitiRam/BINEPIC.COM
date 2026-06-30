import { verifyAccessToken } from '../utils/jwt.js';
import { query } from '../config/db.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);

    // 🔥 CRITICAL: verify user in DB
    const result = await query(
      `SELECT id, primary_role, is_admin, status FROM users WHERE id = $1`,
      [payload.sub]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended' });
    }

    req.user = {
      id: user.id,
      role: user.primary_role,
      isAdmin: user.is_admin
    };

    next();

  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access only' });
  }

  next();
}
