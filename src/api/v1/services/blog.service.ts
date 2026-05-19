import * as blogRepo from '../repositories/blog.repository';

export const createBlogPost = async (data: any, authorId: string, imageFile?: any) => {
  return await blogRepo.createBlog({ ...data, imageFile }, authorId);
};

export const updateBlogPost = async (id: string, data: any, user: any, imageFile?: any) => {
  const blog = await blogRepo.getBlogById(id);
  if (!blog) {
    throw new Error('Blog post not found');
  }

  // RBAC: Writers can only edit their own content
  if (user.role === 'WRITER' && blog.authorId !== user.id) {
    throw new Error('Unauthorized: You can only edit your own blog posts');
  }

  // RBAC: Admin can edit anything

  if (user.role === 'WRITER') {
    // Writers cannot set status to PUBLISHED
    if (data.status === 'PUBLISHED') {
      throw new Error('Unauthorized: Writers cannot publish directly');
    }
  }

  return await blogRepo.updateBlog(id, { ...data, imageFile });
};

export const getBlogImageData = async (id: string) => {
  return await blogRepo.getBlogImage(id);
};

export const getBlogPost = async (idOrSlug: string, isId: boolean = false) => {
  let blog;
  if (isId) {
    blog = await blogRepo.getBlogById(idOrSlug);
  } else {
    blog = await blogRepo.getBlogBySlug(idOrSlug);
  }
  return blog;
};

export const getPublicBlogPost = async (slug: string) => {
  const blog = await blogRepo.getBlogBySlug(slug);
  if (!blog || blog.status !== 'PUBLISHED') {
    return null;
  }
  return blog;
};

export const getAllBlogPosts = async (filters: any) => {
  return await blogRepo.getBlogs(filters);
};

export const getPublicBlogPosts = async (filters: any) => {
  return await blogRepo.getBlogs({ ...filters, status: 'PUBLISHED' });
};

export const deleteBlogPost = async (id: string, user: any) => {
  const blog = await blogRepo.getBlogById(id);
  if (!blog) {
    throw new Error('Blog post not found');
  }

  // Admin can delete anything
  if (user.role === 'Admin') {
    return await blogRepo.deleteBlog(id);
  }

  // WRITER logic
  if (user.role === 'WRITER') {
    if (blog.authorId !== user.id) {
      throw new Error('Unauthorized: You can only delete your own blog posts');
    }
    
    // Restriction: Writers cannot delete published blogs directly
    if (blog.status === 'PUBLISHED') {
      throw new Error('Action Restricted: Published blogs can only be deleted by an Administrator');
    }

    return await blogRepo.deleteBlog(id);
  }

  throw new Error('Unauthorized');
};

export const submitForReview = async (id: string, user: any) => {
  const blog = await blogRepo.getBlogById(id);
  if (!blog) {
    throw new Error('Blog post not found');
  }

  if (blog.authorId !== user.id) {
    throw new Error('Unauthorized');
  }

  return await blogRepo.updateBlog(id, { status: 'REVIEW' });
};

export const adminPublishBlog = async (id: string) => {
  return await blogRepo.updateBlog(id, { status: 'PUBLISHED' });
};

export const adminRejectBlog = async (id: string) => {
  return await blogRepo.updateBlog(id, { status: 'DRAFT' });
};
