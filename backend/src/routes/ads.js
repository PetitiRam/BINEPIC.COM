import express from 'express';
import { listActiveAds } from '../controllers/adminController.js';

const router = express.Router();
router.get('/', listActiveAds);
export default router;
