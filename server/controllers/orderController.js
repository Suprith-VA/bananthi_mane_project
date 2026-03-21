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

    const method = paymentInfo?.paymentMethod || 'COD';
    const pStatus = paymentInfo?.paymentStatus || 'Pending';
    const isPaid = pStatus === 'Paid';

    const order = await prisma.order.create({
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
            price: item.price,
            quantity: item.quantity || item.qty || 1,
            image: item.image || null,
          })),
        },
      },
      include: { items: true, user: { select: { id: true, name: true, email: true, phone: true } } },
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
    if (!req.user.isAdmin && !isOwner) {
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

// PUT /api/orders/:id/status  (admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, fulfillmentStatus } = req.body;
    const data = {};

    if (fulfillmentStatus) data.fulfillmentStatus = fulfillmentStatus;
    if (status) data.status = status;

    if (!status && fulfillmentStatus) {
      data.status = fulfillmentToStatus(fulfillmentStatus);
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

// PUT /api/orders/:id/shiprocket  (admin)
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
