import { z } from 'zod';

export const BlogStatus = z.enum(['DRAFT', 'REVIEW', 'PUBLISHED']);

export const CreateBlogSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150, 'Title must not exceed 150 characters'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(300, 'Excerpt must not exceed 300 characters').optional(),
  featuredImage: z.string().optional(),
  seoTitle: z.string().max(60, 'SEO Title must not exceed 60 characters').optional(),
  seoDescription: z.string().max(160, 'SEO Description must not exceed 160 characters').optional(),
});

export const UpdateBlogSchema = CreateBlogSchema.partial().extend({
  status: BlogStatus.optional(),
});

export const BlogSlugSchema = z.string().min(1, 'Slug is required');

export type CreateBlogInput = z.infer<typeof CreateBlogSchema>;
export type UpdateBlogInput = z.infer<typeof UpdateBlogSchema>;
