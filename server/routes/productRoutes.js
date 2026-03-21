import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, isAdmin, isSuperAdmin, optionalProtect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(optionalProtect, getProducts).post(protect, isSuperAdmin, createProduct);
router.route('/:id').get(getProductById).put(protect, isSuperAdmin, updateProduct).delete(protect, isSuperAdmin, deleteProduct);

export default router;
