import express from 'express';
import { generateNewTemplate, myTemplates, deleteTemplate } from '../controllers/templatesController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', requireAuth, generateNewTemplate);
router.get('/mine', requireAuth, myTemplates);
router.delete('/:id', requireAuth, deleteTemplate);

export default router;
