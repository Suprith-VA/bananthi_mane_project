import prisma from '../config/prisma.js';
import { serializeSubscriber } from '../utils/serializers.js';

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
