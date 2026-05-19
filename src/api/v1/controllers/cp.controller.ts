import { Request, Response } from 'express';
import * as cpService from '../services/cp.service';
import { propertySchema } from '../../../shared/schemas/property.schema';

export const getCPAnalyticsController = async (req: Request, res: Response) => {
  try {
    const data = await cpService.generateDashboardAnalytics(req.user.id);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Error rendering analytics' });
  }
};

export const getDashboardController = async (req: Request, res: Response) => {
  try {
    const data = await cpService.getDashboardStats(req.user.id);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
};

export const getCPPropertiesController = async (req: Request, res: Response) => {
  try {
    const properties = await cpService.listCPProperties(req.user.id);
    res.status(200).json(properties);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch listings' });
  }
};

export const uploadImagesController = async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.id;
    console.log(`[DEBUG] CP Uploading images for property ${propertyId}`);
    console.log('[DEBUG] Files received:', req.files);
    console.log('[DEBUG] Body received:', req.body);
    
    const files = req.files ? (req.files as any[]) : [];
    
    if (files.length === 0) {
      console.warn(`[UPLOAD] No files found in request for property ${propertyId}. Field name used: images`);
      return res.status(400).json({ 
        message: 'No images detected in the request. Ensure you are using the "images" field in your form-data.',
        debug: {
          body: req.body,
          hasFiles: !!req.files,
          fileCount: files.length
        }
      });
    }

    await cpService.uploadPropertyImages(propertyId, req.user.id, files);
    res.status(201).json({ message: 'Images uploaded successfully.' });
  } catch (error: any) {
    console.error('[CRITICAL] Upload Controller Error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    const status = (error.message && error.message.includes('Unauthorized')) ? 403 : 500;
    res.status(status).json({ 
      message: error.message || 'Internal Server Error during image upload',
      error: error.message,
      debugInfo: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        meta: error.meta
      } : undefined
    });
  }
};

export const deleteImageController = async (req: Request, res: Response) => {
  try {
    const { imageId } = req.params;
    await cpService.removePropertyImage(imageId, req.user.id);
    res.status(200).json({ message: 'Image deleted successfully.' });
  } catch (error: any) {
    res.status(403).json({ message: error.message });
  }
};

export const replaceImageController = async (req: Request, res: Response) => {
  try {
    const { imageId } = req.params;
    const newFile = req.file ? (req.file as any) : null;

    if (!newFile) return res.status(400).json({ message: 'No replacement image provided.' });

    await cpService.replacePropertyImage(imageId, req.user.id, newFile);
    res.status(200).json({ message: 'Image replaced successfully.' });
  } catch (error: any) {
    res.status(403).json({ message: error.message });
  }
};

export const modifyPropertyController = async (req: Request, res: Response) => {
  try {
    const validatedData = propertySchema.parse({
      ...req.body,
      amenities: req.body.amenities ? req.body.amenities.split(',').map((a: string) => a.trim()).filter(Boolean) : []
    });

    const result = await cpService.editProperty(req.params.id, req.user.id, {
      ...validatedData,
      images: req.files ? (req.files as any[]) : undefined
    });
    res.status(200).json({ message: 'Property modified securely.', property: result });
  } catch (error: any) {
    res.status(403).json({ message: error.errors || error.message });
  }
};

export const purgePropertyController = async (req: Request, res: Response) => {
  try {
    await cpService.removeProperty(req.params.id, req.user.id);
    res.status(200).json({ message: 'Listing permanently removed.' });
  } catch (error: any) {
    res.status(403).json({ message: error.message });
  }
};

export const markPropertySoldController = async (req: Request, res: Response) => {
  try {
    await cpService.markPropertySold(req.params.id, req.user.id);
    res.status(200).json({ message: 'Listing status transitioned to Sold.' });
  } catch (error: any) {
    res.status(403).json({ message: error.message });
  }
};

export const premiumBoostController = async (req: Request, res: Response) => {
  try {
    await cpService.processPremiumBoostStatus(req.params.id, req.user.id);
    res.status(200).json({ message: 'Premium mechanism successfully boosted this listing footprint!' });
  } catch (error: any) {
    res.status(403).json({ message: error.message });
  }
};
