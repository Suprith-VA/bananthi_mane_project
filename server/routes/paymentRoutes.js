import express from 'express';
import {
  getPaymentConfig,
  createRazorpayOrder,
  verifyAndCreateOrder,
} from '../controllers/paymentController.js';
import { optionalProtect } from '../middleware/auth.js';

const router = express.Router();

router.get('/config', getPaymentConfig);
router.post('/create-order', optionalProtect, createRazorpayOrder);
router.post('/verify', optionalProtect, verifyAndCreateOrder);

export default router;
