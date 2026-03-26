import prisma from '../config/prisma.js';
import { serializeSubscriber } from '../utils/serializers.js';
import { isValidUUID } from '../utils/helpers.js';

// POST /api/subscribe
export const subscribe = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.subscriber.findUnique({ where: { email: normalizedEmail } });

    if (existing && existing.isActive) {
      return res.status(200).json({
        message: 'Already subscribed',
        alreadySubscribed: true,
        subscriber: serializeSubscriber(existing),
      });
    }

    const subscriber = await prisma.subscriber.upsert({
      where: { email: normalizedEmail },
      update: { name, isActive: true },
      create: { email: normalizedEmail, name, isActive: true },
    });

    res.status(201).json({
      message: 'Subscribed successfully',
      subscriber: serializeSubscriber(subscriber),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/admin/subscribers  (admin)
export const getAllSubscribers = async (_req, res) => {
  try {
    const subs = await prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(subs.map(serializeSubscriber));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/subscribers/:id  (super-admin)
export const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return res.status(400).json({ message: 'Valid subscriber id is required' });
    await prisma.subscriber.delete({ where: { id } });
    res.json({ message: 'Subscriber removed' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Subscriber not found' });
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/subscribers/emails  (admin) — returns comma-separated emails for Gmail compose
export const getSubscriberEmails = async (_req, res) => {
  try {
    const subs = await prisma.subscriber.findMany({
      where: { isActive: true },
      select: { email: true },
    });
    res.json({ emails: subs.map(s => s.email) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/broadcast  (admin)
export const adminBroadcast = async (req, res) => {
  try {
    const { subject, content } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ message: 'subject and content are required' });
    }

    const subscribers = await prisma.subscriber.findMany({
      where: { isActive: true },
      select: { email: true, name: true },
    });

    res.json({
      message: 'Broadcast prepared. Email provider integration is not configured yet.',
      subject,
      recipientCount: subscribers.length,
      recipientsPreview: subscribers.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
