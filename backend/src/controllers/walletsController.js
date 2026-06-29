import { query } from '../config/db.js';

export async function myWallet(req, res) {
  try {
    const result = await query(`SELECT * FROM wallets WHERE owner_id = $1 AND type = 'user'`, [req.user.id]);
    return res.json({ wallet: result.rows[0] || null });
  } catch (err) {
    console.error('My wallet error:', err);
    return res.status(500).json({ error: 'Could not load wallet.' });
  }
}

export async function platformWallets(req, res) {
  try {
    const result = await query(`SELECT * FROM wallets WHERE type IN ('platform','escrow')`);
    return res.json({ wallets: result.rows });
  } catch (err) {
    console.error('Platform wallets error:', err);
    return res.status(500).json({ error: 'Could not load platform wallets.' });
  }
}
