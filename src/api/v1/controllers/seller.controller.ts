import { Request, Response } from 'express';
import * as sellerService from '../services/seller.service';

export const getSellerAnalyticsController = async (req: Request, res: Response) => {
  try {
    const data = await sellerService.generateDashboardAnalytics(req.user._id.toString());
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Error rendering analytics' });
  }
};

export const modifyPropertyController = async (req: Request, res: Response) => {
  try {
    const formattedData = { ...req.body };
    
    // Cloudinary upload intercept appended to existing parameters cleanly
    if (req.files) {
      formattedData.images = (req.files as any[]).map(file => file.path);
    }

    if (req.body.amenities) {
      formattedData.amenities = req.body.amenities.split(',').map((a: string) => a.trim());
    }

    const result = await sellerService.editProperty(req.params.id, req.user._id.toString(), formattedData);
    res.status(200).json({ message: 'Property modified securely.', property: result });
  } catch (error: any) {
    res.status(403).json({ message: error.message });
  }
};

export const purgePropertyController = async (req: Request, res: Response) => {
  try {
    await sellerService.removeProperty(req.params.id, req.user._id.toString());
    res.status(200).json({ message: 'Listing permanently removed.' });
  } catch (error: any) {
    res.status(403).json({ message: error.message });
  }
};

export const markPropertySoldController = async (req: Request, res: Response) => {
  try {
    await sellerService.markPropertySold(req.params.id, req.user._id.toString());
    res.status(200).json({ message: 'Listing status transitioned to Sold.' });
  } catch (error: any) {
    res.status(403).json({ message: error.message });
  }
};

export const premiumBoostController = async (req: Request, res: Response) => {
  try {
    await sellerService.processPremiumBoostStatus(req.params.id, req.user._id.toString());
    res.status(200).json({ message: 'Premium mechanism successfully boosted this listing footprint!' });
  } catch (error: any) {
    res.status(403).json({ message: error.message });
  }
};
