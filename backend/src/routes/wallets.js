import express from 'express';
import { myWallet, platformWallets } from '../controllers/walletsController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.get('/mine', requireAuth, myWallet);
router.get('/platform', requireAuth, requireAdmin, platformWallets);
export default router;
