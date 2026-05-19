import { Router } from 'express';
import * as blogController from '../controllers/blog.controller';
import { authMiddleware, roleMiddleware } from '../../../middleware/authMiddleware';
import { uploadToMemory } from '../../../middleware/upload.middleware';

const router = Router();

// Public Routes
router.get('/public', blogController.getPublicBlogsController);
router.get('/public/:slug', blogController.getPublicBlogController);
router.get('/images/:id', blogController.serveBlogImageController);

// Protected Routes
router.use(authMiddleware);

// Admin & Writer Routes
router.get('/', blogController.getBlogsController);
router.get('/:idOrSlug', blogController.getBlogController);

// Writer specific
router.post('/', roleMiddleware('Admin', 'WRITER'), uploadToMemory.single('imageFile'), blogController.createBlogController);
router.put('/:id', roleMiddleware('Admin', 'WRITER'), uploadToMemory.single('imageFile'), blogController.updateBlogController);
router.delete('/:id', roleMiddleware('Admin', 'WRITER'), blogController.deleteBlogController);
router.post('/:id/submit', roleMiddleware('Admin', 'WRITER'), blogController.submitForReviewController);

// Admin specific
router.post('/:id/publish', roleMiddleware('Admin'), blogController.adminPublishBlogController);
router.post('/:id/reject', roleMiddleware('Admin'), blogController.adminRejectBlogController);

export default router;
