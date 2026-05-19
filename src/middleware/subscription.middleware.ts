import { Request, Response, NextFunction } from 'express';
import * as subscriptionRepo from '../api/v1/repositories/subscription.repository';

/**
 * Middleware to ensure the Channel Partner has an active, non-expired subscription.
 * Handles auto-deactivation if expiration is detected during the request.
 */
export const checkActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    // 1. Fetch record marked as active (even if expired)
    const sub = await subscriptionRepo.findCurrentActiveRecord(userId);

    if (!sub) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription found. Please contact administration for a plan assignment.',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    // 2. Check for expiration
    const now = new Date();
    if (now > new Date(sub.endDate)) {
      // Auto-deactivate in DB
      await subscriptionRepo.updateSubscriptionRecord(sub.id, { isActive: false });
      
      return res.status(403).json({
        success: false,
        message: 'Your subscription has expired. Please renew your plan to continue.',
        code: 'SUBSCRIPTION_EXPIRED'
      });
    }

    // 3. Subscription is valid
    next();
  } catch (error) {
    console.error('Subscription Middleware Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error validating subscription' });
  }
};
