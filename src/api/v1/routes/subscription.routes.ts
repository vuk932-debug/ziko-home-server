import { Router } from 'express';
import { 
  assignSubscriptionController, 
  updateSubscriptionController, 
  getMySubscriptionController 
} from '../controllers/subscription.controller';
import { authMiddleware, roleMiddleware } from '../../../middleware/authMiddleware';

const router = Router();

// Admin only routes
router.post('/assign', authMiddleware, roleMiddleware('Admin'), assignSubscriptionController);
router.patch('/:userId', authMiddleware, roleMiddleware('Admin'), updateSubscriptionController);

// CP routes
router.get('/me', authMiddleware, roleMiddleware('CP'), getMySubscriptionController);

export default router;
