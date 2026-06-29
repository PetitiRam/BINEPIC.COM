import express from 'express';
import * as ctrl from './tausiController.js';
import { requireAuth, requireAdmin } from '../../src/middleware/auth.js';

const router = express.Router();

// Buyer-facing
router.get('/recommendations/mine', requireAuth, ctrl.getRecommendationsForMe);
router.get('/ranked', ctrl.getTopRanked);
router.get('/campaigns/active', (req, res, next) => { req.query.status = 'active'; next(); }, ctrl.getCampaigns);

// Admin-gated management
router.use(requireAuth, requireAdmin);
router.get('/dashboard', ctrl.getDashboard);
router.post('/categorize', ctrl.postCategorize);
router.post('/scores/recompute', ctrl.postRecomputeScores);
router.get('/product-intelligence', ctrl.getProductIntelligence);
router.get('/seller-performance', ctrl.getSellerPerformance);

router.post('/campaigns', ctrl.postCampaign);
router.post('/campaigns/:id/review', ctrl.postReviewCampaign);
router.get('/campaigns', ctrl.getCampaigns);
router.post('/campaigns/recompute-scores', ctrl.postRecomputeAdScores);

export default router;
