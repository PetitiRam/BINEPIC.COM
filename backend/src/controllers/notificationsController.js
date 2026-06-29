import { query } from '../config/db.js';

export async function myNotifications(req, res) {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [req.user.id]
    );
    return res.json({ notifications: result.rows });
  } catch (err) {
    console.error('My notifications error:', err);
    return res.status(500).json({ error: 'Could not load notifications.' });
  }
}

export async function markRead(req, res) {
  try {
    await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    return res.json({ message: 'Marked as read.' });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ error: 'Could not update notification.' });
  }
}

// Used by the admin panel (Phase 5) to push a notification to any user.
export async function sendNotification(req, res) {
  const { userId, type, title, body } = req.body;
  try {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, body, sent_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [userId, type || 'system_announcement', title, body, req.user.id]
    );
    return res.status(201).json({ notification: result.rows[0] });
  } catch (err) {
    console.error('Send notification error:', err);
    return res.status(500).json({ error: 'Could not send notification.' });
  }
}
