import express from 'express';
import {
  createProduct, updateProduct, deleteProduct, myProducts,
  browseProducts, browseAgriculture, getProductById
} from '../controllers/productsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Seller management
router.post('/', requireAuth, createProduct);
router.patch('/:id', requireAuth, updateProduct);
router.delete('/:id', requireAuth, deleteProduct);
router.get('/mine', requireAuth, myProducts);

// Main Marketplace (public browsing)
router.get('/', browseProducts);
router.get('/agriculture', browseAgriculture);
router.get('/:id', getProductById);

export default router;
