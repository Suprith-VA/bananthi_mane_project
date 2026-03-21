import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, isAdmin, optionalProtect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(optionalProtect, getProducts).post(protect, isAdmin, createProduct);
router.route('/:id').get(getProductById).put(protect, isAdmin, updateProduct).delete(protect, isAdmin, deleteProduct);

export default router;
