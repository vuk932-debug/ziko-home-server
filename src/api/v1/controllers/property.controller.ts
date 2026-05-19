import { Request, Response } from 'express';
import * as propertyService from '../services/property.service';
import slugify from 'slugify';
import { propertySchema, propertyQuerySchema } from '../../../shared/schemas/property.schema';

export const createListingController = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = propertySchema.parse({
      ...req.body,
      amenities: req.body.amenities ? req.body.amenities.split(',').map((a: string) => a.trim()).filter(Boolean) : []
    });

    const targetSellerId = (req.user.role === 'Admin' && req.body.sellerId) 
      ? req.body.sellerId 
      : req.user.id;

    // Slug generation (Mandatory for Prisma)
    const slug = slugify(validatedData.title, { lower: true }) + '-' + Date.now();

    const property = await propertyService.addProperty({
      ...validatedData,
      slug,
      images: req.files ? (req.files as any[]) : []
    }, targetSellerId);

    res.status(201).json({ message: 'Listing submitted for review.', property });
  } catch (error: any) {
    res.status(400).json({ message: error.errors || error.message });
  }
};

/**
 * Serves property images stored as Blobs in MySQL
 */
export const servePropertyImageController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const image: any = await propertyService.fetchImageById(id);
    
    if (!image || !image.imageData) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Set cache control for better performance (1 year)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', image.mimeType || 'image/jpeg');
    res.send(image.imageData);
  } catch (error: any) {
    res.status(500).json({ message: 'Error serving image' });
  }
};

export const getPublicListingsController = async (req: Request, res: Response) => {
  try {
    const validatedQuery = propertyQuerySchema.parse(req.query);
    const result = await propertyService.fetchPublicProperties(validatedQuery);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.errors || error.message });
  }
};

export const getSuggestsController = async (req: Request, res: Response) => {
  try {
    const result = await propertyService.fetchSuggestions(req.query.q as string || '');
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Search engine unlinked.' });
  }
};

export const getComparisonController = async (req: Request, res: Response) => {
  try {
    const result = await propertyService.fetchComparisons(req.query.ids as string || '');
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Comparision failed.' });
  }
};

export const getSlugController = async (req: Request, res: Response) => {
  try {
    const property = await propertyService.fetchBySlug(req.params.slug);
    if (!property) return res.status(404).json({ message: 'Not found' });
    
    // Abstracting view hook onto buyer controller dynamically is cleaner. But we bypass it here for simplicity
    res.status(200).json(property);
  } catch (error: any) {
    res.status(500).json({ message: 'Fetch errors.' });
  }
};

export const adminSetStatusController = async (req: Request, res: Response) => {
  try {
    const property = await propertyService.adminReviewProperty(req.params.id, req.body.status);
    res.status(200).json({ message: `Property status set to ${req.body.status}`, property });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const refreshListingController = async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.id;
    const sellerId = req.user.id;
    const updatedProperty = await propertyService.refreshListing(propertyId, sellerId);
    res.status(200).json({ message: 'Listing refreshed successfully.', property: updatedProperty });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const incrementImpressionsController = async (req: Request, res: Response) => {
  try {
    const { propertyIds } = req.body;
    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      return res.status(400).json({ message: 'Invalid or missing propertyIds' });
    }
    
    await propertyService.incrementImpressions(propertyIds);
    res.status(200).json({ message: 'Impressions tracked' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to track impressions' });
  }
};
