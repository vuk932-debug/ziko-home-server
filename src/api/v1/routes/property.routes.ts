import { Router } from 'express';
import { 
  createListingController, 
  getPublicListingsController,
  getSuggestsController,
  getComparisonController,
  getSlugController,
  adminSetStatusController,
  refreshListingController,
  servePropertyImageController,
  incrementImpressionsController
} from '../controllers/property.controller';
import { authMiddleware, roleMiddleware, sellerApprovedMiddleware } from '../../../middleware/authMiddleware';
import { checkActiveSubscription } from '../../../middleware/subscription.middleware';
import { uploadToCloudinary } from '../../../middleware/upload.middleware';
import { cacheListings } from '../../../middleware/cache.middleware';

const router = Router();

// Publicly exposed paginated/sorted data caching configurations
router.get('/', cacheListings, getPublicListingsController);
router.get('/suggest', cacheListings, getSuggestsController);
router.get('/compare', cacheListings, getComparisonController);
router.get('/images/:id', servePropertyImageController);
router.post('/impressions', incrementImpressionsController);
router.get('/:slug', cacheListings, getSlugController);

// CP flow integrating Multer Image uploads + Subscription Verification
router.post(
  '/',
  authMiddleware,
  roleMiddleware('CP'),
  sellerApprovedMiddleware,
  checkActiveSubscription,
  uploadToCloudinary.array('images', 10), // Limit payload arrays
  createListingController
);

// Refresh route for CP
router.post(
  '/:id/refresh',
  authMiddleware,
  roleMiddleware('CP'),
  sellerApprovedMiddleware,
  checkActiveSubscription,
  refreshListingController
);

// Admins only
router.put('/:id/status', authMiddleware, roleMiddleware('Admin'), adminSetStatusController);

export default router;
