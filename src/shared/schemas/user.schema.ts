import { z } from 'zod';
import { validatePhone, normalizePhone } from '../utils/countries';

export const userSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  phone: z.string()
    .trim()
    .refine((val) => validatePhone(val), {
      message: 'Invalid phone format (10-15 digits required)'
    })
    .transform((val) => normalizePhone(val)),
  password: z.string().min(8, 'Password must be at least 8 characters').nullable().optional(),
  role: z.enum(['Admin', 'CP', 'Customer', 'WRITER']).default('Customer'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const phoneOnlySchema = z.object({
  phone: z.string()
    .trim()
    .refine((val) => validatePhone(val), {
      message: 'Invalid phone format (10-15 digits required)'
    })
    .transform((val) => normalizePhone(val)),
});

export const otpSchema = phoneOnlySchema.extend({
  code: z.string().length(6, 'OTP must be 6 digits'),
});
