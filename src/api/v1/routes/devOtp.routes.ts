import { Router } from 'express';
import * as devOtpController from '../controllers/devOtp.controller';

const router = Router();

/**
 * Dev OTP Routes
 * ONLY accessible in non-production environments with x-dev-secret header
 */

router.get('/latest', devOtpController.getLatestOtps);
router.get('/by-identifier', devOtpController.getOtpsByIdentifier);
router.post('/cleanup', devOtpController.cleanup);

export default router;
