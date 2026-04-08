import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import marketingRoutes from './routes/marketingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import shiprocketRoutes from './routes/shiprocketRoutes.js';
import partnershipRoutes from './routes/partnershipRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const ALLOWED_ORIGINS = process.env.CLIENT_URL
  ? [
      process.env.CLIENT_URL,
      // Accept both www and non-www variants in production
      process.env.CLIENT_URL.replace('https://www.', 'https://'),
      process.env.CLIENT_URL.replace('https://', 'https://www.'),
    ]
  : ['http://localhost:5173', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shiprocket', shiprocketRoutes);
app.use('/api', marketingRoutes);
app.use('/api/partnership', partnershipRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Port ${PORT} is already in use.\nKill the process using it: lsof -ti :${PORT} | xargs kill -9\nThen restart the server.\n`);
  } else {
    console.error('[Server Error]', err.message);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
  // Log but don't crash — keeps server alive for other requests
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err.message);
  // Only exit for truly unrecoverable errors
  if (err.code !== 'ECONNRESET') process.exit(1);
});
