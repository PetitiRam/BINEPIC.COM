import { query } from '../config/db.js';

const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function uniqueSlug(base) {
  let slug = slugify(base) || 'shop';
  let attempt = 0;
  // append a short random suffix until it's unique
  while (true) {
    const candidate = attempt === 0 ? slug : `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    const existing = await query('SELECT id FROM shops WHERE slug = $1', [candidate]);
    if (existing.rows.length === 0) return candidate;
    attempt += 1;
  }
}

// A seller may only create a shop once their seller upgrade is approved.
export async function createShop(req, res) {
  const { name, description, primaryCategory, currency } = req.body;
  const ownerId = req.user.id;

  if (!name) return res.status(400).json({ error: 'Shop name is required.' });

  try {
    const userResult = await query('SELECT primary_role FROM users WHERE id = $1', [ownerId]);
    if (userResult.rows[0]?.primary_role !== 'seller') {
      return res.status(403).json({ error: 'Your seller upgrade must be approved before you can open a shop.' });
    }

    const existingShop = await query('SELECT id FROM shops WHERE owner_id = $1', [ownerId]);
    if (existingShop.rows.length > 0) {
      return res.status(409).json({ error: 'You already have a shop.' });
    }

    const slug = await uniqueSlug(name);
    const backendUrl = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`;
    const shareLink = `${backendUrl}/shop/${slug}`;

    const result = await query(
      `INSERT INTO shops (owner_id, name, slug, description, primary_category, currency, share_link, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [ownerId, name, slug, description || null, primaryCategory || 'other', currency || 'USD', shareLink]
    );

    return res.status(201).json({
      message: 'Shop created. It will go live once approved by the admin.',
      shop: result.rows[0]
    });
  } catch (err) {
    console.error('Create shop error:', err);
    return res.status(500).json({ error: 'Could not create shop.' });
  }
}

export async function getMyShop(req, res) {
  try {
    const result = await query('SELECT * FROM shops WHERE owner_id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No shop found for your account yet.' });
    return res.json({ shop: result.rows[0] });
  } catch (err) {
    console.error('Get my shop error:', err);
    return res.status(500).json({ error: 'Could not load your shop.' });
  }
}

export async function updateMyShop(req, res) {
  const { name, description, logoUrl, bannerUrl, primaryCategory, currency } = req.body;
  try {
    const result = await query(
      `UPDATE shops SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         logo_url = COALESCE($3, logo_url),
         banner_url = COALESCE($4, banner_url),
         primary_category = COALESCE($5, primary_category),
         currency = COALESCE($6, currency)
       WHERE owner_id = $7 RETURNING *`,
      [name, description, logoUrl, bannerUrl, primaryCategory, currency, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No shop found for your account.' });
    return res.json({ message: 'Shop updated.', shop: result.rows[0] });
  } catch (err) {
    console.error('Update shop error:', err);
    return res.status(500).json({ error: 'Could not update shop.' });
  }
}

// Public — powers both the SPA shop page and the social-preview HTML route.
// Returns the shop "structure": profile + active product listings.
export async function getPublicShopBySlug(req, res) {
  const { slug } = req.params;
  try {
    const shopResult = await query(
      `SELECT id, name, slug, description, logo_url, banner_url, primary_category, currency, status, created_at
       FROM shops WHERE slug = $1`,
      [slug]
    );
    const shop = shopResult.rows[0];
    if (!shop) return res.status(404).json({ error: 'Shop not found.' });

    const productsResult = await query(
      `SELECT id, title, price, currency, images, category, condition, is_featured, is_trending, created_at
       FROM products WHERE shop_id = $1 AND status = 'active'
       ORDER BY is_featured DESC, created_at DESC LIMIT 60`,
      [shop.id]
    );

    return res.json({ shop, products: productsResult.rows });
  } catch (err) {
    console.error('Get public shop error:', err);
    return res.status(500).json({ error: 'Could not load shop.' });
  }
}

export async function listAllShops(req, res) {
  try {
    const result = await query(
      `SELECT id, name, slug, description, logo_url, banner_url, primary_category, created_at
       FROM shops WHERE status = 'active' ORDER BY created_at DESC LIMIT 100`
    );
    return res.json({ shops: result.rows });
  } catch (err) {
    console.error('List shops error:', err);
    return res.status(500).json({ error: 'Could not load shops.' });
  }
}
