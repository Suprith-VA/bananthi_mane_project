import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
} from '../controllers/adminController.js';
import { adminBroadcast } from '../controllers/marketingController.js';
import { protect, isAdmin, isSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/stats', isAdmin, getDashboardStats);

router.get('/users', isSuperAdmin, getAllUsers);
router.get('/users/:id', isSuperAdmin, getUserById);
router.put('/users/:id', isSuperAdmin, updateUser);
router.delete('/users/:id', isSuperAdmin, deleteUser);
router.post('/broadcast', isSuperAdmin, adminBroadcast);

export default router;
