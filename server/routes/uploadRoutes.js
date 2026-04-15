import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'bananthi-mane',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: JPEG, PNG, WebP'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

// POST /api/upload  (admin only) — single image
router.post('/', protect, isAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({
    url: req.file.path,
    publicId: req.file.filename,
    size: req.file.size,
  });
});

// POST /api/upload/multiple  (admin only) — up to 6 images
router.post('/multiple', protect, isAdmin, upload.array('images', 6), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  const results = req.files.map(f => ({
    url: f.path,
    publicId: f.filename,
    size: f.size,
  }));
  res.json(results);
});

// DELETE /api/upload  (admin only) — delete by publicId
router.delete('/', protect, isAdmin, async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ message: 'publicId is required' });
    }
    await cloudinary.uploader.destroy(publicId);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to delete image' });
  }
});

router.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: `File too large. Maximum size is ${MAX_SIZE_MB}MB.` });
  }
  res.status(400).json({ message: err.message || 'Upload failed' });
});

export default router;
