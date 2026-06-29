import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// GET /shop/:slug — this is the link sellers share on social media.
// Crawlers (Facebook/WhatsApp/Twitter/LinkedIn) read the Open Graph tags
// below WITHOUT running JavaScript, so the shop's name, logo and a preview
// of its products render directly in the shared post. Real visitors get
// redirected straight into the JEDIDA SPA shop page.
router.get('/shop/:slug', async (req, res) => {
  const { slug } = req.params;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    const shopResult = await query(
      `SELECT id, name, description, logo_url, banner_url, primary_category FROM shops WHERE slug = $1 AND status = 'active'`,
      [slug]
    );
    const shop = shopResult.rows[0];

    if (!shop) {
      return res.status(404).send('<h1>Shop not found</h1>');
    }

    const productsResult = await query(
      `SELECT title, price, currency, images FROM products
       WHERE shop_id = $1 AND status = 'active' ORDER BY is_featured DESC, created_at DESC LIMIT 4`,
      [shop.id]
    );
    const products = productsResult.rows;

    const previewImage = shop.banner_url || shop.logo_url || `${frontendUrl}/og-default.png`;
    const description = shop.description
      ? shop.description.slice(0, 160)
      : `${products.length} products on JEDIDA Marketplace — ${shop.primary_category.replace('_', ' ')}`;
    const destination = `${frontendUrl}/s/${slug}`;

    const productListHtml = products.map((p) =>
      `<li>${escapeHtml(p.title)} — ${p.currency} ${p.price}</li>`
    ).join('');

    res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(shop.name)} | JEDIDA Marketplace</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <!-- Open Graph (Facebook, WhatsApp, LinkedIn) -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(shop.name)} — JEDIDA Marketplace" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(previewImage)}" />
  <meta property="og:url" content="${escapeHtml(destination)}" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(shop.name)} — JEDIDA Marketplace" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(previewImage)}" />

  <meta http-equiv="refresh" content="0; url=${escapeHtml(destination)}" />
  <script>window.location.replace(${JSON.stringify(destination)});</script>
</head>
<body style="font-family: sans-serif; background:#FBF6EC; color:#16201B; text-align:center; padding:48px;">
  <h1>${escapeHtml(shop.name)}</h1>
  <p>${escapeHtml(description)}</p>
  <ul style="list-style:none; padding:0;">${productListHtml}</ul>
  <p>Redirecting to the shop on JEDIDA Marketplace…</p>
  <a href="${escapeHtml(destination)}">Continue to shop</a>
</body>
</html>`);
  } catch (err) {
    console.error('Shop share preview error:', err);
    res.status(500).send('<h1>Something went wrong</h1>');
  }
});

export default router;
