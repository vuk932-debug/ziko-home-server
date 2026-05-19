import { Router } from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/profile.controller';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { uploadToCloudinary } from '../../../middleware/upload.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getProfile);
router.put('/', uploadToCloudinary.single('profileImage'), updateProfile);
router.post('/change-password', changePassword);

export default router;