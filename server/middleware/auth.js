import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

const extractBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};

export const protect = async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
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
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

export const optionalProtect = async (req, _res, next) => {
  const token = extractBearerToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
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
      },
    });
  } catch {
    req.user = null;
  }

  next();
};

export const isAdmin = (req, res, next) => {
  const hasAdminRole = req.user?.role === 'admin' || req.user?.role === 'super-admin';
  if (req.user && (req.user.isAdmin || hasAdminRole)) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

export const isSuperAdmin = (req, res, next) => {
  if (req.user?.role === 'super-admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized. Super-admin access required.' });
  }
};
