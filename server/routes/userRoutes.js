import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  getProfile,
  updateProfile,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.route('/profile').get(protect, getProfile).put(protect, updateProfile);

export default router;
