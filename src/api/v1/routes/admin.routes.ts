import { Router } from 'express';
import { 
  handleSellerUpdate,
  handlePropertyFeature,
  deletePropertyController,
  restorePropertyController,
  getAnalyticsController,
  assignSubscriptionOverride,
  getLeadsController,
  getAllProperties,
  createAdminProperty,
  updateAdminProperty,
  updatePropertyPlan,
  getAllUsers,
  updateUserRole,
  deleteUserController,
  updateLeadStatus,
  createCpController,
  createWriterController,
  resetUserPasswordTemp,
  resetUserPasswordToken,
  getClientsController,
  updateClientStatusController,
  getClientActivityController,
  uploadImagesController,
  deleteImageController,
  replaceImageController
} from '../controllers/admin.controller';
import { authMiddleware, roleMiddleware } from '../../../middleware/authMiddleware';
import { uploadToCloudinary } from '../../../middleware/upload.middleware';

const router = Router();

// Apply stringent blanket admin block strictly limiting non-admins
router.use(authMiddleware, roleMiddleware('Admin'));

// PROPERTIES:
router.get('/properties', getAllProperties);
router.post('/properties', uploadToCloudinary.array('images', 10), createAdminProperty);
router.put('/properties/:id', uploadToCloudinary.array('images', 10), updateAdminProperty);
router.delete('/properties/:id', deletePropertyController);
router.patch('/properties/:id/restore', restorePropertyController);
router.patch('/properties/:id/plan', updatePropertyPlan);

// IMAGE MANAGEMENT:
router.post('/properties/:id/images', uploadToCloudinary.array('images', 10), uploadImagesController);
router.delete('/properties/images/:imageId', deleteImageController);
router.put('/properties/images/:imageId', uploadToCloudinary.single('image'), replaceImageController);

// USERS:
router.get('/users', getAllUsers);
router.post('/users/cp', createCpController);
router.post('/users/writer', createWriterController);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUserController);
router.post('/users/:id/reset-password-temp', resetUserPasswordTemp);
router.post('/users/:id/reset-password-token', resetUserPasswordToken);

// CLIENTS (Channel Partners):
router.get('/clients', getClientsController);
router.patch('/clients/:id/status', updateClientStatusController);
router.get('/clients/:id/activity', getClientActivityController);

// LEADS:
router.get('/leads', getLeadsController);
router.patch('/leads/:id/status', updateLeadStatus);

// Analytics & Legacy Handlers
router.get('/analytics', getAnalyticsController);
router.put('/sellers/:id/manage', handleSellerUpdate);
router.put('/properties/:id/feature', handlePropertyFeature);
router.post('/subscriptions/assign', assignSubscriptionOverride);

export default router;
