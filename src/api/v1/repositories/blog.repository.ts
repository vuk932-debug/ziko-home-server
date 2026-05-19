import prisma from '../../../config/prisma';
import { BlogStatus } from '@prisma/client';
import slugify from 'slugify';
import { config } from '../../../config/env';

export const mapBlog = (blog: any) => {
  if (!blog) return null;
  return {
    ...blog,
    featuredImage: blog.featuredImageData 
      ? `${config.BACKEND_URL}/api/v1/blogs/images/${blog.id}` 
      : (blog.featuredImage || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop'), // Fallback placeholder
    featuredImageData: undefined, // Hide binary data from response
  };
};

export const createBlog = async (data: any, authorId: string) => {
  const { title, content, excerpt, featuredImage, seoTitle, seoDescription, imageFile } = data;
  
  // Generate unique slug
  let slug = slugify(title, { lower: true, strict: true });
  const existingSlug = await prisma.blog.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now()}`;
  }

  const blog = await prisma.blog.create({
    data: {
      title,
      slug,
      content,
      excerpt,
      featuredImage: typeof featuredImage === 'string' ? featuredImage : null,
      featuredImageData: imageFile ? imageFile.buffer : null,
      featuredImageMimeType: imageFile ? imageFile.mimetype : null,
      seoTitle,
      seoDescription,
      authorId,
      status: 'DRAFT',
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return mapBlog(blog);
};

export const updateBlog = async (id: string, data: any) => {
  const { title, imageFile, ...rest } = data;
  
  let updateData: any = { ...rest };
  
  if (title) {
    let slug = slugify(title, { lower: true, strict: true });
    const existingBlog = await prisma.blog.findFirst({
      where: { 
        slug,
        NOT: { id }
      }
    });
    if (existingBlog) {
      slug = `${slug}-${Date.now()}`;
    }
    updateData.title = title;
    updateData.slug = slug;
  }

  if (imageFile) {
    updateData.featuredImageData = imageFile.buffer;
    updateData.featuredImageMimeType = imageFile.mimetype;
    updateData.featuredImage = null; // Clear URL if binary is uploaded
  }

  if (data.status === 'PUBLISHED') {
    updateData.publishedAt = new Date();
  }

  const blog = await prisma.blog.update({
    where: { id },
    data: updateData,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return mapBlog(blog);
};

export const getBlogById = async (id: string) => {
  const blog = await prisma.blog.findFirst({
    where: { id, isDeleted: false },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  return mapBlog(blog);
};

export const getBlogBySlug = async (slug: string) => {
  const blog = await prisma.blog.findFirst({
    where: { slug, isDeleted: false },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  return mapBlog(blog);
};

export const getBlogs = async (filters: any) => {
  const { status, authorId, page = 1, limit = 10 } = filters;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = { isDeleted: false };
  if (status) where.status = status;
  if (authorId) where.authorId = authorId;

  const [blogs, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.blog.count({ where }),
  ]);

  return { 
    blogs: blogs.map(mapBlog), 
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

export const getBlogImage = async (id: string) => {
  return await prisma.blog.findFirst({
    where: { id, isDeleted: false },
    select: {
      featuredImageData: true,
      featuredImageMimeType: true,
    }
  });
};

export const deleteBlog = async (id: string) => {
  return await prisma.blog.update({
    where: { id },
    data: { isDeleted: true }
  });
};
