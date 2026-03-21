import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updateOrderPayment,
  cancelOrder,
  trackOrder,
  appendShiprocketData,
} from '../controllers/orderController.js';
import { protect, isAdmin, isSuperAdmin, optionalProtect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').post(optionalProtect, createOrder).get(protect, isAdmin, getAllOrders);
router.get('/myorders', protect, getMyOrders);
router.get('/mine', protect, getMyOrders);
router.get('/track/:orderId', trackOrder);
router.route('/:id').get(protect, getOrderById);
router.put('/:id/status', protect, isAdmin, updateOrderStatus);
router.put('/:id/payment', protect, isSuperAdmin, updateOrderPayment);
router.put('/:id/shiprocket', protect, isSuperAdmin, appendShiprocketData);
router.delete('/:id', protect, isSuperAdmin, cancelOrder);

export default router;
