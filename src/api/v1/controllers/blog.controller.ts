import { Request, Response } from 'express';
import * as blogService from '../services/blog.service';
import { CreateBlogSchema, UpdateBlogSchema } from '../../../shared/schemas/blog.schema';

export const createBlogController = async (req: Request, res: Response) => {
  try {
    const validatedData = CreateBlogSchema.parse(req.body);
    const blog = await blogService.createBlogPost(validatedData, req.user.id, req.file);
    res.status(201).json({ message: 'Blog post created as draft', blog });
  } catch (error: any) {
    console.error('[BLOG CONTROLLER] Create Error:', error);
    res.status(400).json({ message: error.errors || error.message });
  }
};

export const updateBlogController = async (req: Request, res: Response) => {
  try {
    const validatedData = UpdateBlogSchema.parse(req.body);
    const blog = await blogService.updateBlogPost(req.params.id, validatedData, req.user, req.file);
    res.status(200).json({ message: 'Blog post updated', blog });
  } catch (error: any) {
    console.error('[BLOG CONTROLLER] Update Error:', error);
    res.status(400).json({ message: error.errors || error.message });
  }
};

export const serveBlogImageController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const imageData = await blogService.getBlogImageData(id);

    if (!imageData || !imageData.featuredImageData) {
      return res.status(404).json({ message: 'Image data not found' });
    }

    res.setHeader('Content-Type', imageData.featuredImageMimeType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(imageData.featuredImageData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBlogController = async (req: Request, res: Response) => {
  try {
    const { idOrSlug } = req.params;
    const isId = req.query.isId === 'true';
    const blog = await blogService.getBlogPost(idOrSlug, isId);
    if (!blog) return res.status(404).json({ message: 'Blog post not found' });
    res.status(200).json(blog);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPublicBlogController = async (req: Request, res: Response) => {
  try {
    const blog = await blogService.getPublicBlogPost(req.params.slug);
    if (!blog) return res.status(404).json({ message: 'Blog post not found' });
    res.status(200).json(blog);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBlogsController = async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status,
      authorId: req.user.role === 'WRITER' ? req.user.id : req.query.authorId,
      page: req.query.page,
      limit: req.query.limit,
    };
    const result = await blogService.getAllBlogPosts(filters);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPublicBlogsController = async (req: Request, res: Response) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
    };
    const result = await blogService.getPublicBlogPosts(filters);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBlogController = async (req: Request, res: Response) => {
  try {
    await blogService.deleteBlogPost(req.params.id, req.user);
    res.status(200).json({ message: 'Blog post deleted' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const submitForReviewController = async (req: Request, res: Response) => {
  try {
    const blog = await blogService.submitForReview(req.params.id, req.user);
    res.status(200).json({ message: 'Blog post submitted for review', blog });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const adminPublishBlogController = async (req: Request, res: Response) => {
  try {
    const blog = await blogService.adminPublishBlog(req.params.id);
    res.status(200).json({ message: 'Blog post published', blog });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const adminRejectBlogController = async (req: Request, res: Response) => {
  try {
    const blog = await blogService.adminRejectBlog(req.params.id);
    res.status(200).json({ message: 'Blog post rejected and moved to draft', blog });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
