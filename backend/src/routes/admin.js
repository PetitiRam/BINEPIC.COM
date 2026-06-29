import express from 'express';
import {
  listUsers, updateUserStatus, assignAdminRole, listKycSubmissions, reviewKyc,
  listPendingShops, reviewShop, listPendingProducts, reviewProduct,
  createAd, listActiveAds, deleteAd, getSettings, updateSettings, platformWalletSummary
} from '../controllers/adminController.js';
import { listPendingUpgrades } from '../controllers/upgradeController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/upgrades/pending', listPendingUpgrades);
router.get('/users', listUsers);
router.patch('/users/:userId/status', updateUserStatus);
router.post('/users/:userId/make-admin', assignAdminRole);

router.get('/kyc', listKycSubmissions);
router.post('/kyc/:id/review', reviewKyc);

router.get('/shops/pending', listPendingShops);
router.post('/shops/:id/review', reviewShop);

router.get('/products/pending', listPendingProducts);
router.post('/products/:id/review', reviewProduct);

router.post('/ads', createAd);
router.delete('/ads/:id', deleteAd);

router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

router.get('/wallet-summary', platformWalletSummary);

export default router;
