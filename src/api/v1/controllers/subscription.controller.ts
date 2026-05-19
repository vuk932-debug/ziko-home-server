import { Request, Response } from 'express';
import * as subscriptionService from '../services/subscription.service';

export const assignSubscriptionController = async (req: Request, res: Response) => {
  try {
    const result = await subscriptionService.assignSubscription(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSubscriptionController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await subscriptionService.updateOrRenewSubscription(userId, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMySubscriptionController = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const result = await subscriptionService.getMySubscription(userId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
