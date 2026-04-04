import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { serializeOrder } from '../utils/serializers.js';
import { sendOrderConfirmationEmail, sendCustomerOrderConfirmationEmail, sendLowStockAlertEmail } from '../services/emailService.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function syncProductStock(tx, productId) {
  const agg = await tx.productVariant.aggregate({
    where: { productId },
    _sum: { stockQuantity: true },
    _count: true,
  });
  if (agg._count > 0) {
    await tx.product.update({
      where: { id: productId },
      data: { stockQuantity: agg._sum.stockQuantity ?? 0 },
    });
  }
}

// GET /api/payments/config — expose key_id (never key_secret) to the frontend
export const getPaymentConfig = (_req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
};

// POST /api/payments/create-order — create a Razorpay order
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const options = {
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('[Razorpay] create order error:', error);
    res.status(500).json({ message: 'Failed to create Razorpay order' });
  }
};

// POST /api/payments/verify — verify signature and create DB order
export const verifyAndCreateOrder = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = req.body;

    // HMAC-SHA256 verification
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed — invalid signature' });
    }

    const {
      items,
      totalPrice,
      shippingAddress,
      guestEmail,
      guestPhone,
      guestName,
    } = orderData;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Validate stock
    for (const item of items) {
      const qty = item.quantity || item.qty || 1;
      if (item.unitLabel && item.product) {
        const variant = await prisma.productVariant.findFirst({
          where: { productId: item.product, unitLabel: item.unitLabel },
        });
        if (variant && variant.stockQuantity < qty) {
          return res.status(400).json({
            message: `Insufficient stock for "${item.name} (${item.unitLabel})". Available: ${variant.stockQuantity}`,
          });
        }
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: req.user?.id || null,
          guestEmail: guestEmail?.toLowerCase().trim() || null,
          guestPhone: guestPhone?.trim() || null,
          guestName: guestName?.trim() || null,
          totalPrice,
          shippingAddress: shippingAddress || null,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          paymentMethod: 'Razorpay',
          paymentStatus: 'Paid',
          isPaid: true,
          paidAt: new Date(),
          status: 'pending',
          fulfillmentStatus: 'Processing',
          items: {
            create: items.map((item) => ({
              productId: item.product || null,
              name: item.name,
              unitLabel: item.unitLabel || null,
              price: item.price,
              quantity: item.quantity || item.qty || 1,
              image: item.image || null,
            })),
          },
        },
        include: {
          items: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      });

      for (const item of created.items) {
        if (!item.productId) continue;
        if (item.unitLabel) {
          const variant = await tx.productVariant.findFirst({
            where: { productId: item.productId, unitLabel: item.unitLabel },
          });
          if (variant) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stockQuantity: { decrement: item.quantity } },
            });
          }
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        }
      }

      const affectedIds = [...new Set(created.items.filter(i => i.productId).map(i => i.productId))];
      for (const pid of affectedIds) {
        await syncProductStock(tx, pid);
      }

      return created;
    });

    // ── Email notifications (fire-and-forget) ──
    // Send order confirmation to sales team
    sendOrderConfirmationEmail(order)
      .catch(err => console.error('[Razorpay → Sales email error]', err.message));

    // Send order confirmation to customer
    sendCustomerOrderConfirmationEmail(order)
      .catch(err => console.error('[Razorpay → Customer email error]', err.message));

    // Check for low stock alerts
    for (const item of order.items) {
      if (!item.productId) continue;
      if (item.unitLabel) {
        const variant = await prisma.productVariant.findFirst({
          where: { productId: item.productId, unitLabel: item.unitLabel },
        });
        if (variant && variant.stockQuantity <= 5) {
          const prod = await prisma.product.findUnique({ where: { id: item.productId }, select: { name: true } });
          sendLowStockAlertEmail(prod?.name || item.name, item.unitLabel, variant.stockQuantity)
            .catch(err => console.error('[Razorpay → Low stock email error]', err.message));
        }
      }
    }

    res.status(201).json(serializeOrder(order));
  } catch (error) {
    console.error('[Razorpay] verify error:', error);
    res.status(500).json({ message: error.message || 'Payment verification failed' });
  }
};
