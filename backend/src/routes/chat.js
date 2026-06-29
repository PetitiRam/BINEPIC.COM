import express from 'express';
import { myThread, sendAsUser, listThreads, adminThreadMessages, sendAsAdmin } from '../controllers/chatController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/mine', requireAuth, myThread);
router.post('/mine', requireAuth, sendAsUser);

router.get('/threads', requireAuth, requireAdmin, listThreads);
router.get('/threads/:userId', requireAuth, requireAdmin, adminThreadMessages);
router.post('/threads/:userId', requireAuth, requireAdmin, sendAsAdmin);

export default router;
