import { Router } from 'express';
import { 
  registerController, 
  loginController, 
  refreshTokenController, 
  logoutController,
  sendOtpController,
  resendOtpController,
  verifyOtpController,
  verifyWidgetController,
  forgotPasswordController,
  resetPasswordController,
  validateUserExistenceController
} from '../controllers/auth.controller';
import { authMiddleware, roleMiddleware, sellerApprovedMiddleware } from '../../../middleware/authMiddleware';
import { otpLimiter, authLimiter } from '../../../middleware/rateLimiter';

const router = Router();

router.get('/validate-user-existence', authLimiter, validateUserExistenceController);
router.post('/register', registerController);
router.post('/login', loginController);
router.post('/refresh-token', refreshTokenController);
router.post('/logout', logoutController);

// OTP Routes
router.post('/send-otp', otpLimiter, sendOtpController);
router.post('/resend-otp', otpLimiter, resendOtpController);
router.post('/verify-otp', verifyOtpController);
router.post('/verify-widget', verifyWidgetController);

// Password Reset Routes
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password/:token', resetPasswordController);

// Examples of protected routes
router.get('/me', authMiddleware, (req: any, res) => {
  res.status(200).json({ user: req.user });
});

router.get('/admin-only', authMiddleware, roleMiddleware('Admin'), (req, res) => {
  res.status(200).json({ message: 'Welcome Admin!' });
});

router.post('/add-listing', authMiddleware, sellerApprovedMiddleware, (req, res) => {
  res.status(200).json({ message: 'Listing added successfully!' });
});

export default router;
