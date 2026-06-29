import express from 'express';
import { requestUpgrade, payUpgradeFee, myUpgradeStatus, approveUpgrade, listPendingUpgrades } from '../controllers/upgradeController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/request', requireAuth, requestUpgrade);
router.post('/pay-fee', requireAuth, payUpgradeFee);
router.get('/status', requireAuth, myUpgradeStatus);
router.get('/pending', requireAuth, requireAdmin, listPendingUpgrades);
router.post('/:upgradeId/review', requireAuth, requireAdmin, approveUpgrade);

export default router;
