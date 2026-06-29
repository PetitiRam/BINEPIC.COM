import express from 'express';
import {
  createShop, getMyShop, updateMyShop, getPublicShopBySlug, listAllShops
} from '../controllers/shopsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, createShop);
router.get('/me', requireAuth, getMyShop);
router.patch('/me', requireAuth, updateMyShop);
router.get('/public/:slug', getPublicShopBySlug); // used by SPA + social-preview HTML route
router.get('/', listAllShops); // Main Marketplace "Shops" tab

export default router;
