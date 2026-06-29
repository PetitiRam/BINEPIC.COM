import { query } from '../config/db.js';

export async function listUsers(req, res) {
  const { role, status } = req.query;
  const conditions = [];
  const values = [];
  let i = 1;
  if (role) { conditions.push(`primary_role = $${i}`); values.push(role); i += 1; }
  if (status) { conditions.push(`status = $${i}`); values.push(status); i += 1; }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query(
    `SELECT id, email, full_name, phone_number, primary_role, is_admin, status, kyc_status, created_at
     FROM users ${where} ORDER BY created_at DESC LIMIT 200`, values
  );
  res.json({ users: result.rows });
}

export async function updateUserStatus(req, res) {
  const { userId } = req.params;
  const { status } = req.body; // active | suspended | rejected
  const result = await query('UPDATE users SET status = $1 WHERE id = $2 RETURNING id, status', [status, userId]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
  res.json({ message: 'User status updated.', user: result.rows[0] });
}

export async function assignAdminRole(req, res) {
  const { userId } = req.params;
  await query('UPDATE users SET is_admin = TRUE WHERE id = $1', [userId]);
  await query('INSERT INTO admin_assignments (user_id, assigned_by) VALUES ($1,$2)', [userId, req.user.id]);
  res.json({ message: 'User granted admin access.' });
}

export async function listKycSubmissions(req, res) {
  const result = await query(
    `SELECT k.*, u.full_name, u.email FROM kyc_submissions k JOIN users u ON u.id = k.user_id
     WHERE k.status = 'pending' ORDER BY k.created_at DESC`
  );
  res.json({ submissions: result.rows });
}

export async function reviewKyc(req, res) {
  const { id } = req.params;
  const { decision, notes } = req.body; // approve | reject
  const status = decision === 'approve' ? 'approved' : 'rejected';
  const result = await query(
    `UPDATE kyc_submissions SET status = $1, reviewed_by = $2, reviewer_notes = $3, reviewed_at = now() WHERE id = $4 RETURNING *`,
    [status, req.user.id, notes || null, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Submission not found.' });
  await query('UPDATE users SET kyc_status = $1 WHERE id = $2', [status, result.rows[0].user_id]);
  await query(
    `INSERT INTO notifications (user_id, type, title, body, sent_by) VALUES ($1,'kyc_update','KYC review update',$2,$3)`,
    [result.rows[0].user_id, `Your KYC submission was ${status}.`, req.user.id]
  );
  res.json({ message: `KYC ${status}.` });
}

export async function listPendingShops(req, res) {
  const result = await query(`SELECT * FROM shops WHERE status = 'pending' ORDER BY created_at DESC`);
  res.json({ shops: result.rows });
}

export async function reviewShop(req, res) {
  const { id } = req.params;
  const { decision } = req.body;
  const status = decision === 'approve' ? 'active' : 'rejected';
  const result = await query('UPDATE shops SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Shop not found.' });
  await query(
    `INSERT INTO notifications (user_id, type, title, body, sent_by) VALUES ($1,$2,$3,$4,$5)`,
    [result.rows[0].owner_id, status === 'active' ? 'shop_approved' : 'shop_rejected',
     status === 'active' ? 'Your shop is live!' : 'Shop rejected', `Your shop "${result.rows[0].name}" was ${status}.`, req.user.id]
  );
  res.json({ message: `Shop ${status}.`, shop: result.rows[0] });
}

export async function listPendingProducts(req, res) {
  const result = await query(
    `SELECT p.*, s.name AS shop_name FROM products p JOIN shops s ON s.id = p.shop_id
     WHERE p.status = 'pending_review' ORDER BY p.created_at DESC`
  );
  res.json({ products: result.rows });
}

export async function reviewProduct(req, res) {
  const { id } = req.params;
  const { decision } = req.body;
  const status = decision === 'approve' ? 'active' : 'rejected';
  const result = await query('UPDATE products SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
  const shop = await query('SELECT owner_id FROM shops WHERE id = $1', [result.rows[0].shop_id]);
  await query(
    `INSERT INTO notifications (user_id, type, title, body, sent_by) VALUES ($1,$2,$3,$4,$5)`,
    [shop.rows[0].owner_id, status === 'active' ? 'product_approved' : 'product_rejected',
     status === 'active' ? 'Listing approved' : 'Listing rejected', `"${result.rows[0].title}" was ${status}.`, req.user.id]
  );
  res.json({ message: `Product ${status}.` });
}

// ===== Ads =====
export async function createAd(req, res) {
  const { title, imageUrl, linkUrl } = req.body;
  const result = await query(
    'INSERT INTO ads (title, image_url, link_url, created_by) VALUES ($1,$2,$3,$4) RETURNING *',
    [title, imageUrl, linkUrl || null, req.user.id]
  );
  res.status(201).json({ ad: result.rows[0] });
}
export async function listActiveAds(req, res) {
  const result = await query('SELECT * FROM ads WHERE active = TRUE ORDER BY created_at DESC');
  res.json({ ads: result.rows });
}
export async function deleteAd(req, res) {
  await query('UPDATE ads SET active = FALSE WHERE id = $1', [req.params.id]);
  res.json({ message: 'Ad removed.' });
}

// ===== Platform settings (logo, theme, card orientation, fee %) =====
export async function getSettings(req, res) {
  const result = await query('SELECT * FROM platform_settings WHERE id = 1');
  res.json({ settings: result.rows[0] });
}
export async function updateSettings(req, res) {
  const { logoUrl, themePrimaryColor, themeAccentColor, productCardOrientation, platformFeePercent, upgradeFeeAmount } = req.body;
  const result = await query(
    `UPDATE platform_settings SET
       logo_url = COALESCE($1, logo_url),
       theme_primary_color = COALESCE($2, theme_primary_color),
       theme_accent_color = COALESCE($3, theme_accent_color),
       product_card_orientation = COALESCE($4, product_card_orientation),
       platform_fee_percent = COALESCE($5, platform_fee_percent),
       upgrade_fee_amount = COALESCE($6, upgrade_fee_amount)
     WHERE id = 1 RETURNING *`,
    [logoUrl, themePrimaryColor, themeAccentColor, productCardOrientation, platformFeePercent, upgradeFeeAmount]
  );
  res.json({ message: 'Settings updated.', settings: result.rows[0] });
}

export async function platformWalletSummary(req, res) {
  const wallets = await query(`SELECT * FROM wallets WHERE type IN ('platform','escrow')`);
  const orderStats = await query(`SELECT status, COUNT(*) FROM orders GROUP BY status`);
  res.json({ wallets: wallets.rows, orderStats: orderStats.rows });
}
