// PETITI's site-editing surface (petitiRoutes.js) is admin-gated for writes,
// but the *output* of that editing — a published page, the current custom
// CSS/logo override, active components — must be readable by every visitor.
// This file is therefore intentionally public (no requireAuth).

import express from 'express';
import { getPageBySlug, listComponents, getThemeOverrides } from '../../ai/petiti/petitiService.js';

const router = express.Router();

router.get('/pages/:slug', async (req, res) => {
  const page = await getPageBySlug(req.params.slug);
  if (!page) return res.status(404).json({ error: 'Page not found.' });
  res.json({ page });
});

router.get('/components', async (req, res) => {
  const components = await listComponents(req.query.placement);
  res.json({ components });
});

router.get('/theme', async (req, res) => {
  const theme = await getThemeOverrides();
  res.json({ theme });
});

export default router;
