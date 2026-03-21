import prisma from '../config/prisma.js';
import { serializeUser } from '../utils/serializers.js';
import { isValidUUID, hashPassword, syncRoleAdmin } from '../utils/helpers.js';

// GET /api/admin/users  (admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isAdmin: true,
        isSubscribedToNewsletter: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(users.map(serializeUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/users/:id  (admin)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Valid user id is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isAdmin: true,
        isSubscribedToNewsletter: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(serializeUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/users/:id  (admin)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Valid user id is required' });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (target.role === 'super-admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Only a super-admin can modify another super-admin' });
    }

    const data = {};

    if (req.body.role) {
      const { role, isAdmin } = syncRoleAdmin(req.body.role, req.body.isAdmin);
      data.role = role;
      data.isAdmin = isAdmin;
    }

    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.firstName !== undefined) data.firstName = req.body.firstName;
    if (req.body.lastName !== undefined) data.lastName = req.body.lastName;
    if (req.body.phone !== undefined) data.phone = req.body.phone;
    if (typeof req.body.isSubscribedToNewsletter === 'boolean') {
      data.isSubscribedToNewsletter = req.body.isSubscribedToNewsletter;
    }

    if (req.body.password) {
      data.password = await hashPassword(req.body.password);
    }

    const updated = await prisma.user.update({ where: { id }, data });

    res.json(serializeUser(updated));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/admin/users/:id  (admin — only super-admin can delete admins)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Valid user id is required' });
    }

    if (id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ message: 'User not found' });

    if ((target.role === 'admin' || target.role === 'super-admin') && req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Only a super-admin can remove admin accounts' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User removed' });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Cannot delete user with existing orders. Consider changing their role instead.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/stats  (admin)
export const getDashboardStats = async (_req, res) => {
  try {
    const [userCount, orderCount, productCount, blogCount, subscriberCount, recentOrders] =
      await Promise.all([
        prisma.user.count(),
        prisma.order.count(),
        prisma.product.count({ where: { isActive: true } }),
        prisma.blog.count({ where: { isPublished: true } }),
        prisma.subscriber.count({ where: { isActive: true } }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            totalPrice: true,
            fulfillmentStatus: true,
            paymentStatus: true,
            createdAt: true,
          },
        }),
      ]);

    res.json({
      users: userCount,
      orders: orderCount,
      products: productCount,
      blogs: blogCount,
      subscribers: subscriberCount,
      recentOrders: recentOrders.map((o) => ({ ...o, _id: o.id })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
