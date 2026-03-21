import prisma from '../config/prisma.js';
import { serializeBlog } from '../utils/serializers.js';
import { isValidUUID, toSlug } from '../utils/helpers.js';

// GET /api/blogs
export const getBlogs = async (req, res) => {
  try {
    const featuredOnly = req.query.featured === 'true';
    const where = featuredOnly
      ? { isPublished: true, isFeatured: true }
      : { isPublished: true };

    const blogs = await prisma.blog.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    res.json(blogs.map(serializeBlog));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/blogs/:slugOrId
export const getBlogBySlugOrId = async (req, res) => {
  try {
    const identifier = req.params.slugOrId;
    const where = isValidUUID(identifier)
      ? { id: identifier, isPublished: true }
      : { slug: identifier, isPublished: true };

    const blog = await prisma.blog.findFirst({
      where,
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(serializeBlog(blog));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/blogs  (admin)
export const createBlog = async (req, res) => {
  try {
    const { title, slug, content, featuredImage, authorName, isPublished } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const resolvedSlug = slug || toSlug(title);
    const published = isPublished ?? false;

    const blog = await prisma.blog.create({
      data: {
        title,
        slug: resolvedSlug,
        content,
        featuredImage: featuredImage || '',
        authorId: req.user?.id || null,
        authorName: authorName || req.user?.name || null,
        isPublished: published,
        isFeatured: req.body.isFeatured ?? false,
        publishedAt: published ? new Date() : null,
      },
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json(serializeBlog(blog));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'A blog with that slug already exists' });
    }
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/blogs/:id  (admin)
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Valid blog id is required' });
    }

    const data = { ...req.body };
    delete data._id;
    delete data.id;
    delete data.author;

    if (data.title && !data.slug) {
      data.slug = toSlug(data.title);
    }

    if (data.isPublished === true) {
      const existing = await prisma.blog.findUnique({ where: { id } });
      if (existing && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    } else if (data.isPublished === false) {
      data.publishedAt = null;
    }

    const blog = await prisma.blog.update({
      where: { id },
      data,
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    res.json(serializeBlog(blog));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Blog not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'A blog with that slug already exists' });
    }
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/blogs/:id  (admin)
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Valid blog id is required' });
    }

    await prisma.blog.delete({ where: { id } });
    res.json({ message: 'Blog removed' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

// GET /api/blogs/admin/all  (admin)
export const getAllBlogsAdmin = async (_req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    res.json(blogs.map(serializeBlog));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
