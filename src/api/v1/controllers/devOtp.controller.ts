import { Request, Response } from 'express';
import * as devOtpService from '../services/devOtp.service';
import { config } from '../../../config/env';

/**
 * Dev OTP Controller
 * Provides secure access to OTPs and Reset Tokens during development.
 */

const validateDevRequest = (req: Request) => {
  const isEnabled = config.ENABLE_DEV_OTP_ROUTES;
  
  if (!isEnabled) {
    console.log('[DEV-OTP] Request rejected: ENABLE_DEV_OTP_ROUTES is not true');
    return { valid: false, reason: 'Dev routes are disabled via ENABLE_DEV_OTP_ROUTES' };
  }

  const devSecret = req.headers['x-dev-secret'];
  if (devSecret !== config.DEV_OTP_SECRET) {
    console.log(`[DEV-OTP] Request rejected: Invalid secret. Received: ${devSecret}`);
    return { valid: false, reason: 'Invalid x-dev-secret header' };
  }

  return { valid: true };
};

export const getLatestOtps = async (req: Request, res: Response) => {
  const { valid, reason } = validateDevRequest(req);
  if (!valid) {
    return res.status(403).json({ message: `Forbidden: ${reason}` });
  }

  try {
    const otps = await devOtpService.getLatestOtps();
    res.json(otps);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getOtpsByIdentifier = async (req: Request, res: Response) => {
  const { valid, reason } = validateDevRequest(req);
  if (!valid) {
    return res.status(403).json({ message: `Forbidden: ${reason}` });
  }

  try {
    const identifier = req.query.identifier || req.query.email;
    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({ message: 'Identifier or Email query parameter is required' });
    }

    const otps = await devOtpService.getOtpsByIdentifier(identifier);
    res.json(otps);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const cleanup = async (req: Request, res: Response) => {
  const { valid, reason } = validateDevRequest(req);
  if (!valid) {
    return res.status(403).json({ message: `Forbidden: ${reason}` });
  }

  try {
    await devOtpService.cleanupExpiredDevOtps();
    res.json({ message: 'Expired dev OTPs cleaned up' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
