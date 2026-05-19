import { z } from 'zod';
import { validatePhone, normalizePhone } from '../utils/countries';

export const propertySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100).trim(),
  description: z.string().min(10, 'Description must be at least 10 characters').trim(),
  price: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number()
      .positive('Price must be greater than 0')
      .max(1000000000, 'Price exceeds maximum limit (100 Cr)')
  ),
  propertyType: z.string().min(1, 'Property type is required'),
  bedrooms: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val) : val),
    z.number()
      .int('Bedrooms must be an integer')
      .nonnegative('Bedrooms cannot be negative')
      .max(50, 'Bedrooms cannot exceed 50')
  ),
  bathrooms: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val) : val),
    z.number()
      .int('Bathrooms must be an integer')
      .nonnegative('Bathrooms cannot be negative')
      .max(50, 'Bathrooms cannot exceed 50')
  ),
  area: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number()
      .positive('Area must be greater than 0')
      .max(1000000, 'Area exceeds maximum limit (10 lakh sqft)')
  ),
  location: z.string().min(1, 'Specific area/sector is required').trim(),
  country: z.string().trim().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required').trim(),
  state: z.string().min(1, 'State is required').trim(),
  pincode: z.string().regex(/^\d+$/, 'Pincode must be numeric').min(4).max(10).trim(),
  lat: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').default(0)
  ),
  lng: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').default(0)
  ),
  contactNumber: z.string()
    .nullable()
    .optional()
    .refine((val) => !val || validatePhone(val), {
      message: 'Invalid phone format (10-15 digits required)'
    })
    .transform((val) => val ? normalizePhone(val) : val)
    .or(z.literal('')),
  amenities: z.union([z.string(), z.array(z.string())]).optional(),
});

export const propertyQuerySchema = z.object({
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.preprocess((val) => (val ? parseFloat(val as string) : undefined), z.number().positive().optional()),
  maxPrice: z.preprocess((val) => (val ? parseFloat(val as string) : undefined), z.number().positive().optional()),
  propertyType: z.string().optional(),
  bedrooms: z.preprocess((val) => (val ? parseInt(val as string) : undefined), z.number().int().nonnegative().optional()),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'relevance']).optional().default('relevance'),
  page: z.preprocess((val) => (val ? parseInt(val as string) : 1), z.number().int().positive().default(1)),
  limit: z.preprocess((val) => (val ? parseInt(val as string) : 10), z.number().int().positive().default(10)),
  seed: z.preprocess((val) => (val ? parseInt(val as string) : undefined), z.number().int().optional()),
});
