import express from 'express';
import { myNotifications, markRead, sendNotification } from '../controllers/notificationsController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/mine', requireAuth, myNotifications);
router.post('/:id/read', requireAuth, markRead);
router.post('/send', requireAuth, requireAdmin, sendNotification);

export default router;
