import { Router } from 'express';
import { getMyLeadsController } from '../controllers/interaction.controller';
import { 
  getSellerAnalyticsController,
  modifyPropertyController,
  purgePropertyController,
  markPropertySoldController,
  premiumBoostController 
} from '../controllers/seller.controller';
import { authMiddleware, roleMiddleware, sellerApprovedMiddleware } from '../../../middleware/authMiddleware';
import { uploadToCloudinary } from '../../../middleware/upload.middleware';

const router = Router();

// Blanket Security
router.use(authMiddleware, roleMiddleware('Seller'), sellerApprovedMiddleware);

// Analytics & Metrics
router.get('/analytics', getSellerAnalyticsController);
router.get('/leads', getMyLeadsController);

// Property Asset Modifications
router.put('/properties/:id', uploadToCloudinary.array('images', 15), modifyPropertyController);
router.delete('/properties/:id', purgePropertyController);
router.put('/properties/:id/sold', markPropertySoldController);

// Premium Subscription Capabilities
router.put('/properties/:id/boost', premiumBoostController);

export default router;
