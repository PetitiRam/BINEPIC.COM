import express from 'express';
import {
  createOrder, confirmPayment, confirmDelivery, releaseFunds,
  myOrdersAsBuyer, myOrdersAsSeller, myOrdersAsDelivery, allOrders, assignDelivery
} from '../controllers/ordersController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, createOrder);
router.post('/:orderId/confirm-payment', requireAuth, confirmPayment);
router.post('/:orderId/confirm-delivery', requireAuth, confirmDelivery);
router.post('/:orderId/release-funds', requireAuth, requireAdmin, releaseFunds);
router.post('/:orderId/assign-delivery', requireAuth, requireAdmin, assignDelivery);

router.get('/mine/buyer', requireAuth, myOrdersAsBuyer);
router.get('/mine/seller', requireAuth, myOrdersAsSeller);
router.get('/mine/delivery', requireAuth, myOrdersAsDelivery);
router.get('/all', requireAuth, requireAdmin, allOrders);

export default router;
