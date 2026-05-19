import { Router } from 'express';
import { 
  handleSaveProperty, 
  getSavedProperties, 
  handleContactSeller,
  generateLead,
} from '../controllers/interaction.controller';
import { pushRecentlyViewed } from '../repositories/interaction.repository';
import { authMiddleware, roleMiddleware } from '../../../middleware/authMiddleware';

const router = Router();

// Guest flow logic - anyone mapping a POST can construct an email intercept
router.post('/properties/:id/contact', handleContactSeller);

// Strictly Protected Buyer Layouts
router.use(authMiddleware); // Requires JWT

// Capture lead for gated property access
router.post('/leads/capture', generateLead);

// Track views natively bridging buyer identities
router.put('/properties/:id/view', async (req: any, res: any) => {
  await pushRecentlyViewed(req.user._id, req.params.id);
  res.status(200).send();
});

router.post('/properties/:id/save', roleMiddleware('Buyer'), handleSaveProperty);
router.get('/saved', roleMiddleware('Buyer'), getSavedProperties);

export default router;
