import * as tausi from './tausiService.js';
import * as category from './tausiCategoryEngine.js';
import * as rec from './tausiRecommendationEngine.js';
import * as ads from './tausiAdsEngine.js';
import { query } from '../../src/config/db.js';

export async function getDashboard(req, res) {
  const [campaigns, performance] = await Promise.all([
    ads.listCampaigns({ status: 'active' }),
    tausi.allSellerPerformance()
  ]);
  res.json({ activeCampaigns: campaigns, sellerPerformance: performance.slice(0, 10) });
}

export async function postCategorize(req, res) {
  const result = category.categorize(req.body);
  res.json(result);
}

export async function postRecomputeScores(req, res) {
  const updated = await rec.computeScoresForAllProducts();
  res.json({ message: `Recomputed scores for ${updated} products.`, updated });
}

export async function getTopRanked(req, res) {
  const { category: cat, limit } = req.query;
  const products = await rec.topRankedByCategory(cat, limit ? Number(limit) : 20);
  res.json({ products });
}

export async function getRecommendationsForMe(req, res) {
  const products = await rec.recommendForUser(req.user.id);
  res.json({ products });
}

export async function getProductIntelligence(req, res) {
  const result = await query(`
    SELECT p.id, p.title, p.category, ps.overall_score, ps.quality_score, ps.demand_score, ps.trust_score
    FROM products p JOIN product_scores ps ON ps.product_id = p.id
    ORDER BY ps.overall_score DESC LIMIT 100
  `);
  res.json({ products: result.rows });
}

export async function getSellerPerformance(req, res) {
  const result = await tausi.allSellerPerformance();
  res.json({ sellers: result });
}

// ===== Ads =====
export async function postCampaign(req, res) {
  const campaign = await ads.createCampaign(req.body);
  res.status(201).json({ campaign });
}
export async function postReviewCampaign(req, res) {
  const campaign = await ads.reviewCampaign(req.params.id, req.body.decision);
  res.json({ campaign });
}
export async function getCampaigns(req, res) {
  const campaigns = await ads.listCampaigns({ status: req.query.status });
  res.json({ campaigns });
}
export async function postRecomputeAdScores(req, res) {
  const updated = await ads.computePerformanceScores();
  res.json({ message: `Recomputed ${updated} campaign scores.` });
}
