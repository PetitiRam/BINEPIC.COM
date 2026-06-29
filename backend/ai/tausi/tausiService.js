// TAUSI — AI Product Manager: categorization, ranking, recommendations,
// ads/campaign management, marketplace optimization, seller performance.

import { query } from '../../src/config/db.js';
import { log, recordAction } from '../petiti/petitiService.js';

export { log, recordAction };

export async function sellerPerformance(shopId) {
  const stats = await query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'active') AS active_listings,
      COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_listings,
      COALESCE(SUM(orders_count), 0) AS total_orders,
      COALESCE(SUM(views_count), 0) AS total_views
    FROM products WHERE shop_id = $1
  `, [shopId]);

  const row = stats.rows[0];
  const conversionRate = Number(row.total_views) > 0
    ? Number(((Number(row.total_orders) / Number(row.total_views)) * 100).toFixed(2))
    : 0;

  return {
    activeListings: Number(row.active_listings),
    rejectedListings: Number(row.rejected_listings),
    totalOrders: Number(row.total_orders),
    totalViews: Number(row.total_views),
    conversionRate
  };
}

export async function allSellerPerformance() {
  const shops = await query(`SELECT id, name FROM shops WHERE status = 'active'`);
  const results = [];
  for (const shop of shops.rows) {
    const perf = await sellerPerformance(shop.id);
    results.push({ shopId: shop.id, shopName: shop.name, ...perf });
  }
  return results.sort((a, b) => b.conversionRate - a.conversionRate);
}
