import { Router } from 'express';
import { getCpLeadsController } from '../controllers/lead.controller';
import { 
  getCPAnalyticsController,
  getDashboardController,
  getCPPropertiesController,
  uploadImagesController,
  deleteImageController,
  replaceImageController,
  modifyPropertyController,
  purgePropertyController,
  markPropertySoldController,
  premiumBoostController 
} from '../controllers/cp.controller';
import { authMiddleware, roleMiddleware, sellerApprovedMiddleware } from '../../../middleware/authMiddleware';
import { checkActiveSubscription } from '../../../middleware/subscription.middleware';
import { uploadToCloudinary } from '../../../middleware/upload.middleware';

const router = Router();

// Blanket Security
router.use(authMiddleware, roleMiddleware('CP'), sellerApprovedMiddleware);

// Analytics & Metrics
router.get('/dashboard', getDashboardController);
router.get('/analytics', getCPAnalyticsController);
router.get('/properties', getCPPropertiesController);
router.get('/leads', getCpLeadsController);

// Restricted Actions (Active Subscription Required)
router.put('/properties/:id', checkActiveSubscription, uploadToCloudinary.array('images', 15), modifyPropertyController);
router.delete('/properties/:id', checkActiveSubscription, purgePropertyController);
router.put('/properties/:id/sold', checkActiveSubscription, markPropertySoldController);
router.put('/properties/:id/boost', checkActiveSubscription, premiumBoostController);

// Granular Image Management
router.post('/properties/:id/images', checkActiveSubscription, uploadToCloudinary.array('images', 10), uploadImagesController);
router.delete('/properties/images/:imageId', checkActiveSubscription, deleteImageController);
router.put('/properties/images/:imageId', checkActiveSubscription, uploadToCloudinary.single('image'), replaceImageController);

export default router;
