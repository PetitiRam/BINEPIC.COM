import { query } from '../../src/config/db.js';
import { log, recordAction } from './tausiService.js';

// Scores every active product on quality (has description/images/specs),
// demand (views/orders), and trust (shop status + seller history), then
// writes to product_scores and recomputes per-category rankings.
export async function computeScoresForAllProducts() {
  const products = await query(`
    SELECT p.*, s.status AS shop_status FROM products p JOIN shops s ON s.id = p.shop_id
    WHERE p.status = 'active'
  `);

  let updated = 0;
  for (const p of products.rows) {
    const qualityScore = Math.min(100,
      (p.description?.length > 30 ? 35 : 10) +
      ((p.images?.length || 0) > 0 ? 35 : 0) +
      (Object.keys(p.specs || {}).length > 0 ? 30 : 0)
    );
    const demandScore = Math.min(100, (p.views_count || 0) * 0.5 + (p.orders_count || 0) * 10);
    const trustScore = p.shop_status === 'active' ? (p.ai_polished ? 90 : 70) : 30;
    const overallScore = Math.round(qualityScore * 0.4 + demandScore * 0.35 + trustScore * 0.25);

    await query(
      `INSERT INTO product_scores (product_id, quality_score, demand_score, trust_score, overall_score, notes, computed_at)
       VALUES ($1,$2,$3,$4,$5,$6, now())
       ON CONFLICT (product_id) DO UPDATE SET
         quality_score = $2, demand_score = $3, trust_score = $4, overall_score = $5, notes = $6, computed_at = now()`,
      [p.id, Math.round(qualityScore), Math.round(demandScore), trustScore, overallScore, 'Computed by TAUSI']
    );
    updated += 1;
  }

  await recomputeRankings();
  await log('tausi', 'info', 'products', `Recomputed scores for ${updated} products.`);
  return updated;
}

async function recomputeRankings() {
  await query('DELETE FROM product_rankings');
  const categories = await query(`SELECT DISTINCT category FROM products WHERE status = 'active'`);
  for (const { category } of categories.rows) {
    const ranked = await query(`
      SELECT p.id FROM products p JOIN product_scores ps ON ps.product_id = p.id
      WHERE p.category = $1 AND p.status = 'active'
      ORDER BY ps.overall_score DESC LIMIT 100
    `, [category]);
    let rank = 1;
    for (const row of ranked.rows) {
      await query(
        `INSERT INTO product_rankings (product_id, category, rank) VALUES ($1,$2,$3)`,
        [row.id, category, rank]
      );
      rank += 1;
    }
  }
}

export async function topRankedByCategory(category, limit = 20) {
  const result = await query(`
    SELECT p.*, pr.rank, ps.overall_score FROM product_rankings pr
    JOIN products p ON p.id = pr.product_id
    JOIN product_scores ps ON ps.product_id = p.id
    WHERE pr.category = $1 ORDER BY pr.rank ASC LIMIT $2
  `, [category, limit]);
  return result.rows;
}

// Personalized recommendations for a buyer based on their order history's
// categories — falls back to globally top-scored products for new buyers.
export async function recommendForUser(userId, limit = 12) {
  const history = await query(`
    SELECT DISTINCT p.category FROM orders o JOIN products p ON p.id = o.product_id WHERE o.buyer_id = $1
  `, [userId]);

  let products;
  if (history.rows.length > 0) {
    const categories = history.rows.map((r) => r.category);
    products = await query(`
      SELECT p.*, ps.overall_score FROM products p JOIN product_scores ps ON ps.product_id = p.id
      WHERE p.status = 'active' AND p.category = ANY($1)
      ORDER BY ps.overall_score DESC LIMIT $2
    `, [categories, limit]);
  } else {
    products = await query(`
      SELECT p.*, ps.overall_score FROM products p JOIN product_scores ps ON ps.product_id = p.id
      WHERE p.status = 'active' ORDER BY ps.overall_score DESC LIMIT $1
    `, [limit]);
  }

  for (const p of products.rows) {
    await query(
      `INSERT INTO recommendation_logs (user_id, product_id, reason, score) VALUES ($1,$2,$3,$4)`,
      [userId, p.id, history.rows.length > 0 ? 'category_affinity' : 'top_scored', p.overall_score]
    );
  }

  return products.rows;
}

export async function recommendationHistory(userId) {
  const result = await query('SELECT * FROM recommendation_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]);
  return result.rows;
}
