import { query } from '../config/db.js';
import { polishListing } from '../services/nsubugaJosephBot.js';

async function getOwnedShopId(userId) {
  const result = await query('SELECT id FROM shops WHERE owner_id = $1', [userId]);
  return result.rows[0]?.id || null;
}

// Create a new listing. Runs it through "Nsubuga Joseph" (the listing-polish
// bot) before it goes to pending_review, then a human admin still approves it.
export async function createProduct(req, res) {
  const {
    title, description, category, condition, price, currency, quantityAvailable,
    sku, images, specs, locationCity, locationCountry, shippingOptions, templateId
  } = req.body;

  if (!title || !price) return res.status(400).json({ error: 'Title and price are required.' });

  try {
    const shopId = await getOwnedShopId(req.user.id);
    if (!shopId) return res.status(403).json({ error: 'Open your shop before listing products.' });

    const polished = await polishListing({ title, description, category, specs });

    const result = await query(
      `INSERT INTO products (
         shop_id, template_id, title, description, category, condition, price, currency,
         quantity_available, sku, images, specs, location_city, location_country,
         shipping_options, status, ai_polished, ai_polish_notes
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'pending_review',$16,$17)
       RETURNING *`,
      [
        shopId, templateId || null, polished.title, polished.description, category || 'other',
        condition || 'new', price, currency || 'USD', quantityAvailable || 1, sku || null,
        images || [], specs || {}, locationCity || null, locationCountry || null,
        JSON.stringify(shippingOptions || []), true, polished.notes
      ]
    );

    return res.status(201).json({
      message: 'Listing created and polished by Nsubuga Joseph. It will appear in the Marketplace once approved.',
      product: result.rows[0]
    });
  } catch (err) {
    console.error('Create product error:', err);
    return res.status(500).json({ error: 'Could not create listing.' });
  }
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  const fields = req.body;
  const allowed = ['title', 'description', 'category', 'condition', 'price', 'currency',
    'quantity_available', 'sku', 'images', 'specs', 'location_city', 'location_country', 'shipping_options', 'status'];

  const shopId = await getOwnedShopId(req.user.id);
  if (!shopId) return res.status(403).json({ error: 'You do not have a shop.' });

  const sets = [];
  const values = [];
  let i = 1;
  for (const key of Object.keys(fields)) {
    const column = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    if (allowed.includes(column)) {
      sets.push(`${column} = $${i}`);
      values.push(fields[key]);
      i += 1;
    }
  }
  if (sets.length === 0) return res.status(400).json({ error: 'No valid fields to update.' });

  try {
    values.push(id, shopId);
    const result = await query(
      `UPDATE products SET ${sets.join(', ')} WHERE id = $${i} AND shop_id = $${i + 1} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found in your shop.' });
    return res.json({ message: 'Listing updated.', product: result.rows[0] });
  } catch (err) {
    console.error('Update product error:', err);
    return res.status(500).json({ error: 'Could not update listing.' });
  }
}

export async function deleteProduct(req, res) {
  const { id } = req.params;
  const shopId = await getOwnedShopId(req.user.id);
  if (!shopId) return res.status(403).json({ error: 'You do not have a shop.' });

  try {
    const result = await query('DELETE FROM products WHERE id = $1 AND shop_id = $2 RETURNING id', [id, shopId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found in your shop.' });
    return res.json({ message: 'Listing removed.' });
  } catch (err) {
    console.error('Delete product error:', err);
    return res.status(500).json({ error: 'Could not remove listing.' });
  }
}

// "Down the seller should be able to see his/her own listed products"
export async function myProducts(req, res) {
  try {
    const shopId = await getOwnedShopId(req.user.id);
    if (!shopId) return res.json({ products: [] });
    const result = await query('SELECT * FROM products WHERE shop_id = $1 ORDER BY created_at DESC', [shopId]);
    return res.json({ products: result.rows });
  } catch (err) {
    console.error('My products error:', err);
    return res.status(500).json({ error: 'Could not load your products.' });
  }
}

// Main Marketplace feed — "All Products" tab, with category filter and
// trending/popular/high-demand sorting for the buyer dashboard.
export async function browseProducts(req, res) {
  const { category, sort = 'newest', limit = 40 } = req.query;
  const conditions = [`status = 'active'`];
  const values = [];
  let i = 1;

  if (category) {
    conditions.push(`category = $${i}`);
    values.push(category);
    i += 1;
  }

  const orderBy = {
    newest: 'created_at DESC',
    trending: 'is_trending DESC, views_count DESC',
    popular: 'orders_count DESC',
    high_demand: 'orders_count DESC, views_count DESC',
    price_low: 'price ASC',
    price_high: 'price DESC'
  }[sort] || 'created_at DESC';

  values.push(Number(limit));

  try {
    const result = await query(
      `SELECT p.*, s.name AS shop_name, s.slug AS shop_slug
       FROM products p JOIN shops s ON s.id = p.shop_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${orderBy} LIMIT $${i}`,
      values
    );
    return res.json({ products: result.rows });
  } catch (err) {
    console.error('Browse products error:', err);
    return res.status(500).json({ error: 'Could not load products.' });
  }
}

// Agriculture tab — "agriculture is the backbone of our country"
export async function browseAgriculture(req, res) {
  try {
    const result = await query(
      `SELECT p.*, s.name AS shop_name, s.slug AS shop_slug
       FROM products p JOIN shops s ON s.id = p.shop_id
       WHERE p.status = 'active' AND p.category = 'agriculture'
       ORDER BY p.created_at DESC LIMIT 60`
    );
    return res.json({ products: result.rows });
  } catch (err) {
    console.error('Browse agriculture error:', err);
    return res.status(500).json({ error: 'Could not load agricultural products.' });
  }
}

export async function getProductById(req, res) {
  try {
    const result = await query(
      `SELECT p.*, s.name AS shop_name, s.slug AS shop_slug, s.logo_url AS shop_logo
       FROM products p JOIN shops s ON s.id = p.shop_id WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
    await query('UPDATE products SET views_count = views_count + 1 WHERE id = $1', [req.params.id]);
    return res.json({ product: result.rows[0] });
  } catch (err) {
    console.error('Get product error:', err);
    return res.status(500).json({ error: 'Could not load product.' });
  }
}
