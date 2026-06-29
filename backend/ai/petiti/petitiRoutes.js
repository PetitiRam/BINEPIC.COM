import express from 'express';
import * as ctrl from './petitiController.js';
import { requireAuth, requireAdmin } from '../../src/middleware/auth.js';

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/dashboard', ctrl.getDashboard);

router.get('/logs', ctrl.getLogs);

router.get('/alerts', ctrl.getAlerts);
router.post('/alerts/:id/resolve', ctrl.postResolveAlert);

router.get('/actions', ctrl.getActions);
router.post('/actions/:id/approve', ctrl.postApproveAction);

router.get('/security', ctrl.getSecurityOverview);
router.post('/security/scan', ctrl.postRunSecurityScan);
router.get('/security/risk/:userId', ctrl.getRiskScore);

router.get('/marketplace', ctrl.getMarketplaceIntelligence);
router.get('/recommendations', ctrl.getRecommendations);

router.get('/health', ctrl.getHealthHistory);

// site-editing surface
router.put('/site/logo', ctrl.putLogo);
router.put('/site/theme', ctrl.putTheme);
router.put('/site/css', ctrl.putCustomCss);
router.get('/site/pages', ctrl.getPages);
router.post('/site/pages', ctrl.postPage);
router.delete('/site/pages/:id', ctrl.deletePageHandler);
router.post('/site/propose-code-change', ctrl.postProposeCodeChange);

export default router;
