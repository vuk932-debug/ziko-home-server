import { z } from 'zod';
import { validatePhone, normalizePhone } from '../utils/countries';

export const leadSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  phone: z.string()
    .trim()
    .refine((val) => validatePhone(val), {
      message: 'Invalid phone format (10-15 digits required)'
    })
    .transform((val) => normalizePhone(val)),
  message: z.string().max(500, 'Message too long').nullable().optional().or(z.literal('')),
  source: z.string().optional().default('PROPERTY_VIEW'),
});
