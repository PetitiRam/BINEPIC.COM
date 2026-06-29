import { query } from '../../src/config/db.js';
import { recordAction } from './petitiService.js';

export async function marketplaceSnapshot() {
  const [users, shops, products, orders, gmv] = await Promise.all([
    query(`SELECT primary_role, COUNT(*) FROM users GROUP BY primary_role`),
    query(`SELECT status, COUNT(*) FROM shops GROUP BY status`),
    query(`SELECT status, COUNT(*) FROM products GROUP BY status`),
    query(`SELECT status, COUNT(*) FROM orders GROUP BY status`),
    query(`SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE status = 'completed'`)
  ]);
  return {
    usersByRole: users.rows,
    shopsByStatus: shops.rows,
    productsByStatus: products.rows,
    ordersByStatus: orders.rows,
    completedGmv: Number(gmv.rows[0].total)
  };
}

// Generates plain-language growth/operations recommendations from current
// marketplace data — real aggregate queries, not canned text.
export async function generateRecommendations() {
  const recs = [];

  const staleShops = await query(`
    SELECT s.id, s.name FROM shops s
    LEFT JOIN products p ON p.shop_id = s.id
    WHERE s.status = 'active' GROUP BY s.id, s.name HAVING COUNT(p.id) = 0
  `);
  if (staleShops.rows.length > 0) {
    recs.push({
      type: 'seller_engagement', priority: 'medium',
      message: `${staleShops.rows.length} active shop(s) have zero listings. Consider nudging them with a notification or onboarding tip.`,
      data: { shops: staleShops.rows.map((s) => s.name) }
    });
  }

  const lowStock = await query(`SELECT id, title, quantity_available FROM products WHERE status = 'active' AND quantity_available <= 2`);
  if (lowStock.rows.length > 0) {
    recs.push({
      type: 'inventory', priority: 'low',
      message: `${lowStock.rows.length} product(s) are nearly out of stock — sellers may want to restock soon.`,
      data: { products: lowStock.rows.map((p) => p.title) }
    });
  }

  const categoryDemand = await query(`
    SELECT category, COUNT(*) AS orders FROM orders o JOIN products p ON p.id = o.product_id
    GROUP BY category ORDER BY orders DESC LIMIT 1
  `);
  if (categoryDemand.rows.length > 0) {
    recs.push({
      type: 'category_growth', priority: 'high',
      message: `"${categoryDemand.rows[0].category}" is the highest-demand category by order volume — consider a featured promotion or ad placement here.`,
      data: categoryDemand.rows[0]
    });
  }

  const pendingTooLong = await query(`SELECT COUNT(*) FROM products WHERE status = 'pending_review' AND created_at < now() - interval '24 hours'`);
  if (Number(pendingTooLong.rows[0].count) > 0) {
    recs.push({
      type: 'ops_backlog', priority: 'high',
      message: `${pendingTooLong.rows[0].count} product listing(s) have been awaiting admin review for over 24 hours — approval backlog risks seller churn.`,
      data: {}
    });
  }

  await recordAction({ actor: 'petiti', actionType: 'generate_recommendations', payload: { count: recs.length }, status: 'executed' });
  return recs;
}
