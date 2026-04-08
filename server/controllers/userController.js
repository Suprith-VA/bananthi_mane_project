import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { serializeUser } from '../utils/serializers.js';
import {
  hashPassword,
  comparePassword,
  generateResetToken,
  hashResetToken,
  syncNameFields,
  syncRoleAdmin,
} from '../utils/helpers.js';
import { sendNewUserRegistrationEmail, sendPasswordResetEmail } from '../services/emailService.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const toAuthPayload = (user) => ({
  ...serializeUser(user),
  token: generateToken(user.id),
});

// POST /api/users/register  &  POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      firstName,
      lastName,
      email,
      phone,
      password,
      isSubscribedToNewsletter,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const computedName = name || [firstName, lastName].filter(Boolean).join(' ').trim();
    if (!computedName) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const synced = syncNameFields({ name: computedName, firstName, lastName });
    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        ...synced,
        email: email.toLowerCase().trim(),
        phone,
        password: hashed,
        isSubscribedToNewsletter: isSubscribedToNewsletter ?? true,
        ...syncRoleAdmin('user', false),
      },
    });

    res.status(201).json(toAuthPayload(user));

    // Send new user registration notification to sales (fire-and-forget)
    sendNewUserRegistrationEmail({
      name: computedName,
      email: user.email,
      phone: phone || '',
    }).catch(err => console.error('[Registration email error]', err.message));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST /api/users/login  &  POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json(toAuthPayload(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/me
export const getMe = async (req, res) => {
  res.json(serializeUser(req.user));
};

// GET /api/users/profile
export const getProfile = async (req, res) => {
  res.json(serializeUser(req.user));
};

// PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const current = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!current) return res.status(404).json({ message: 'User not found' });

    const nextFirst = req.body.firstName ?? current.firstName;
    const nextLast = req.body.lastName ?? current.lastName;
    const computedName = req.body.name
      ?? ([nextFirst, nextLast].filter(Boolean).join(' ').trim() || current.name);
    const synced = syncNameFields({
      name: computedName,
      firstName: nextFirst,
      lastName: nextLast,
    });

    const data = {
      ...synced,
      phone: req.body.phone ?? current.phone,
    };

    if (typeof req.body.isSubscribedToNewsletter === 'boolean') {
      data.isSubscribedToNewsletter = req.body.isSubscribedToNewsletter;
    }

    if (req.body.password) {
      data.password = await hashPassword(req.body.password);
    }

    const updated = await prisma.user.update({ where: { id: req.user.id }, data });
    res.json(toAuthPayload(updated));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(200).json({ message: 'If this email is registered, reset instructions were generated.' });
    }

    const { raw, hashed, expires } = generateResetToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: hashed, resetPasswordExpire: expires },
    });

    const baseUrl = process.env.CLIENT_URL || 'https://www.bananthimane.com';
    const resetUrl = `${baseUrl}/reset-password/${raw}`;

    // Send password reset email to the customer
    sendPasswordResetEmail({
      email: user.email,
      name: user.name || user.firstName || '',
      resetUrl,
    }).catch(err => console.error('[Password reset email error]', err.message));

    res.json({
      message: 'If this email is registered, a password reset link has been sent.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    const hashedToken = hashResetToken(req.params.token);
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { gt: new Date() },
      },
    });

    if (!user) return res.status(400).json({ message: 'Token is invalid or expired' });
    if (!req.body.password) return res.status(400).json({ message: 'New password is required' });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(req.body.password),
        resetPasswordToken: null,
        resetPasswordExpire: null,
      },
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
