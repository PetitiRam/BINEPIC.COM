import { query } from '../config/db.js';

// A non-admin user only ever has ONE thread: with "the admin team".
// Any admin can reply; messages are keyed by user_id (the non-admin party).
export async function myThread(req, res) {
  const result = await query('SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC', [req.user.id]);
  res.json({ messages: result.rows });
}

export async function sendAsUser(req, res) {
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'Message cannot be empty.' });
  const result = await query(
    'INSERT INTO chat_messages (user_id, sender_id, body) VALUES ($1,$2,$3) RETURNING *',
    [req.user.id, req.user.id, body.trim()]
  );
  res.status(201).json({ message: result.rows[0] });
}

// Admin view: list of users who have at least one message, most recent first.
export async function listThreads(req, res) {
  const result = await query(`
    SELECT DISTINCT ON (cm.user_id) cm.user_id, u.full_name, u.primary_role, cm.body AS last_message, cm.created_at
    FROM chat_messages cm JOIN users u ON u.id = cm.user_id
    ORDER BY cm.user_id, cm.created_at DESC
  `);
  res.json({ threads: result.rows });
}

export async function adminThreadMessages(req, res) {
  const result = await query('SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC', [req.params.userId]);
  res.json({ messages: result.rows });
}

export async function sendAsAdmin(req, res) {
  const { userId } = req.params;
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'Message cannot be empty.' });
  const result = await query(
    'INSERT INTO chat_messages (user_id, sender_id, body) VALUES ($1,$2,$3) RETURNING *',
    [userId, req.user.id, body.trim()]
  );
  res.status(201).json({ message: result.rows[0] });
}
