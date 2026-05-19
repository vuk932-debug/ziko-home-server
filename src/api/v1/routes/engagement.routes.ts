import { Router } from 'express';
import * as engagementController from '../controllers/engagement.controller';
import { authMiddleware, softAuthMiddleware } from '../../../middleware/authMiddleware';

const router = Router();

// Stats (Public or Optional Auth for isLiked status)
router.get('/stats', softAuthMiddleware, engagementController.getStatsController);

// Share Tracking (Public or Optional Auth)
router.post('/share', softAuthMiddleware, engagementController.trackShareController);

// Like Toggle (Requires Auth)
router.post('/toggle-like', authMiddleware, engagementController.toggleLikeController);

export default router;
