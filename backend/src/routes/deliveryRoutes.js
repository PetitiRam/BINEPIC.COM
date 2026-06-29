import express from 'express';
import * as ctrl from '../controllers/deliveryController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/drivers/register', requireAuth, ctrl.registerDriver);
router.get('/drivers/me', requireAuth, ctrl.myDriverProfile);
router.get('/drivers', requireAuth, requireAdmin, ctrl.listDrivers);

router.post('/', requireAuth, requireAdmin, ctrl.createDelivery);
router.post('/:id/assign-driver', requireAuth, requireAdmin, ctrl.assignDriver);
router.post('/:id/status', requireAuth, ctrl.updateStatus);
router.get('/:id/timeline', requireAuth, ctrl.getTimeline);
router.get('/by-order/:orderId', requireAuth, ctrl.getByOrder);
router.get('/mine/driver', requireAuth, ctrl.myDriverDeliveries);
router.get('/all', requireAuth, requireAdmin, ctrl.allDeliveries);

export default router;
