import { Router } from 'express';
import { 
  createLeadController, 
  getCpLeadsController, 
  sendLeadOtpController, 
  verifyLeadOtpController,
  verifyLeadWidgetController,
  updateLeadStatusController,
  addLeadNoteController,
  getLeadNotesController
} from '../controllers/lead.controller';
import { authMiddleware, softAuthMiddleware } from '../../../middleware/authMiddleware';

const router = Router();

// Public lead capture flow (OTP Verified)
router.post('/send-otp', sendLeadOtpController);
router.post('/verify-otp', softAuthMiddleware, verifyLeadOtpController);
router.post('/verify-widget', softAuthMiddleware, verifyLeadWidgetController);

// Lead capture (Direct - optional auth)
router.post('/', softAuthMiddleware, createLeadController);

// Authenticated CP lead fetch
router.get('/cp', authMiddleware, getCpLeadsController);
router.patch('/:id/status', authMiddleware, updateLeadStatusController);
router.post('/:id/notes', authMiddleware, addLeadNoteController);
router.get('/:id/notes', authMiddleware, getLeadNotesController);

export default router;
