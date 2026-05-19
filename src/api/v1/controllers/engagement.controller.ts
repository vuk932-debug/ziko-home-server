import { Request, Response } from 'express';
import * as engagementService from '../services/engagement.service';

export const toggleLikeController = async (req: Request, res: Response) => {
  try {
    const { entityId, entityType } = req.body;
    if (!entityId || !entityType) {
      return res.status(400).json({ message: 'entityId and entityType are required' });
    }
    const result = await engagementService.toggleLike(req.user.id, entityId, entityType);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getStatsController = async (req: Request, res: Response) => {
  try {
    const { entityId, entityType } = req.query;
    if (!entityId || !entityType) {
      return res.status(400).json({ message: 'entityId and entityType are required' });
    }
    const userId = req.user?.id; // Optional if not logged in
    const stats = await engagementService.getEngagementStats(entityId as string, entityType as string, userId);
    res.status(200).json(stats);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const trackShareController = async (req: Request, res: Response) => {
  try {
    const { entityId, entityType, platform } = req.body;
    if (!entityId || !entityType || !platform) {
      return res.status(400).json({ message: 'entityId, entityType and platform are required' });
    }
    const userId = req.user?.id; // Optional
    await engagementService.trackShare(entityId, entityType, platform, userId);
    res.status(201).json({ message: 'Share tracked' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
