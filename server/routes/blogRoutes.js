import express from 'express';
import {
  getBlogs,
  getBlogBySlugOrId,
  createBlog,
  updateBlog,
  deleteBlog,
  getAllBlogsAdmin,
} from '../controllers/blogController.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getBlogs);
router.get('/admin/all', protect, isAdmin, getAllBlogsAdmin);
router.post('/', protect, isAdmin, createBlog);
router.get('/:slugOrId', getBlogBySlugOrId);
router.put('/:id', protect, isAdmin, updateBlog);
router.delete('/:id', protect, isAdmin, deleteBlog);

export default router;
