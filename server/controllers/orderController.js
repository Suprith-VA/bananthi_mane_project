import prisma from '../config/prisma.js';
import { serializeOrder } from '../utils/serializers.js';
import { isValidUUID, fulfillmentToStatus } from '../utils/helpers.js';

// POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      orderItems,
      totalPrice,
      shippingAddress,
      guestEmail,
      guestPhone,
      guestName,
      paymentInfo,
    } = req.body;

    const normalizedItems = orderItems || items;
    if (!normalizedItems || normalizedItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    if (!req.user && (!guestEmail || !guestPhone || !guestName)) {
      return res.status(400).json({ message: 'Guest details are required for guest checkout' });
    }

    // Validate stock availability — check variant stock when variantId present
    for (const item of normalizedItems) {
      const qty = item.quantity || item.qty || 1;
      if (item.variantId) {
        const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
        if (variant && variant.stockQuantity < qty) {
          return res.status(400).json({
            message: `Insufficient stock for "${item.name} (${item.unitLabel || variant.unitLabel})". Available: ${variant.stockQuantity}, requested: ${qty}`,
          });
        }
      } else if (item.product) {
        const product = await prisma.product.findUnique({ where: { id: item.product } });
        if (!product) continue;
        if (product.stockQuantity < qty) {
          return res.status(400).json({
            message: `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, requested: ${qty}`,
          });
        }
      }
    }

    const method = paymentInfo?.paymentMethod || 'COD';
    const pStatus = paymentInfo?.paymentStatus || 'Pending';
    const isPaid = pStatus === 'Paid';

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: req.user?.id || null,
          guestEmail: guestEmail?.toLowerCase().trim(),
          guestPhone: guestPhone?.trim(),
          guestName: guestName?.trim(),
          totalPrice,
          shippingAddress: shippingAddress || null,
          razorpayOrderId: paymentInfo?.razorpayOrderId,
          paymentMethod: method,
          paymentStatus: pStatus,
          isPaid,
          paidAt: isPaid ? new Date() : null,
          status: 'pending',
          fulfillmentStatus: 'Processing',
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.product || null,
              name: item.name,
              unitLabel: item.unitLabel || null,
              price: item.price,
              quantity: item.quantity || item.qty || 1,
              image: item.image || null,
            })),
          },
        },
        include: { items: true, user: { select: { id: true, name: true, email: true, phone: true } } },
      });

      // Decrement stock — prefer variant stock when available
      for (const item of created.items) {
        if (item.productId) {
          // Find matching variant by unitLabel
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
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        }
      }

      return created;
    });

    res.status(201).json(serializeOrder(order));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/orders/mine  &  GET /api/orders/myorders
export const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders.map(serializeOrder));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner = order.userId && order.userId === req.user.id;
    const hasAdminRole = req.user.role === 'admin' || req.user.role === 'super-admin';
    if (!hasAdminRole && !req.user.isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(serializeOrder(order));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders  (admin)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders.map(serializeOrder));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: restore stock for an order's items (used when cancelling)
async function restoreStock(tx, items) {
  for (const item of items) {
    if (item.productId) {
      if (item.unitLabel) {
        const variant = await tx.productVariant.findFirst({
          where: { productId: item.productId, unitLabel: item.unitLabel },
        });
        if (variant) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      }
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: item.quantity } },
      });
    }
  }
}

// Helper: deduct stock for an order's items (used when reactivating a cancelled order)
async function deductStock(tx, items) {
  for (const item of items) {
    if (item.productId) {
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
      }
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }
  }
}

// PUT /api/orders/:id/status  (admin — both admin + super-admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, fulfillmentStatus } = req.body;
    const data = {};

    if (fulfillmentStatus) data.fulfillmentStatus = fulfillmentStatus;
    if (status) data.status = status;

    if (!status && fulfillmentStatus) {
      data.status = fulfillmentToStatus(fulfillmentStatus);
    }

    const existing = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!existing) return res.status(404).json({ message: 'Order not found' });

    const wasCancelled = existing.fulfillmentStatus === 'Cancelled';
    const becomingCancelled = fulfillmentStatus === 'Cancelled';

    // Cancelling a non-cancelled order → restore stock
    if (becomingCancelled && !wasCancelled) {
      const order = await prisma.$transaction(async (tx) => {
        await restoreStock(tx, existing.items);
        return tx.order.update({
          where: { id: req.params.id },
          data,
          include: {
            items: true,
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        });
      });
      return res.json(serializeOrder(order));
    }

    // Reactivating a cancelled order → deduct stock again
    if (wasCancelled && !becomingCancelled) {
      const order = await prisma.$transaction(async (tx) => {
        await deductStock(tx, existing.items);
        return tx.order.update({
          where: { id: req.params.id },
          data,
          include: {
            items: true,
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        });
      });
      return res.json(serializeOrder(order));
    }

    // No stock change needed for other transitions
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data,
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    res.json(serializeOrder(order));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/orders/:id/payment  (super-admin only)
export const updateOrderPayment = async (req, res) => {
  try {
    const { paymentStatus, paymentMethod, isPaid } = req.body;
    const data = {};

    if (paymentStatus) data.paymentStatus = paymentStatus;
    if (paymentMethod) data.paymentMethod = paymentMethod;
    if (typeof isPaid === 'boolean') {
      data.isPaid = isPaid;
      data.paidAt = isPaid ? new Date() : null;
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data,
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    res.json(serializeOrder(order));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/orders/:id  (super-admin only — cancel order + restore stock)
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.fulfillmentStatus === 'Cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    await prisma.$transaction(async (tx) => {
      await restoreStock(tx, order.items);
      await tx.order.update({
        where: { id },
        data: {
          fulfillmentStatus: 'Cancelled',
          status: 'cancelled',
        },
      });
    });

    res.json({ message: 'Order cancelled and stock restored' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/track/:orderId
export const trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { email, phone } = req.query;

    if (!isValidUUID(orderId)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone is required for tracking' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { id: true, email: true, phone: true } } },
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const normalizedEmail = email?.toString().toLowerCase().trim();
    const normalizedPhone = phone?.toString().trim();

    const matchesGuest =
      (normalizedEmail && order.guestEmail === normalizedEmail) ||
      (normalizedPhone && order.guestPhone === normalizedPhone);

    const matchesRegistered =
      order.user &&
      ((normalizedEmail && order.user.email?.toLowerCase() === normalizedEmail) ||
        (normalizedPhone && order.user.phone === normalizedPhone));

    if (!matchesGuest && !matchesRegistered) {
      return res.status(403).json({ message: 'Tracking details do not match this order' });
    }

    res.json({
      _id: order.id,
      id: order.id,
      createdAt: order.createdAt,
      fulfillmentStatus: order.fulfillmentStatus,
      paymentStatus: order.paymentStatus,
      awbCode: order.awbCode,
      courierName: order.courierName,
      shipmentId: order.shipmentId,
      totalPrice: order.totalPrice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/orders/:id/shiprocket  (super-admin only)
export const appendShiprocketData = async (req, res) => {
  try {
    const { shiprocketOrderId, shipmentId, awbCode, courierName } = req.body;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        shiprocketOrderId,
        shipmentId,
        awbCode,
        courierName,
      },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    res.json(serializeOrder(order));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(400).json({ message: error.message });
  }
};
