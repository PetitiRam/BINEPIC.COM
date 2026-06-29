import express from 'express';
import { getSettings } from '../controllers/adminController.js';
import { getPageBySlug } from '../../ai/petiti/petitiService.js';

const router = express.Router();
router.get('/', getSettings);

// Public read of a PETITI-authored dynamic page (used by /p/:slug on the frontend)
router.get('/pages/:slug', async (req, res) => {
  const page = await getPageBySlug(req.params.slug);
  if (!page) return res.status(404).json({ error: 'Page not found.' });
  res.json({ page });
});

export default router;
