import express from 'express';
import { subscribe, submitContactForm, submitServiceWaitlist } from '../controllers/marketingController.js';

const router = express.Router();

router.post('/subscribe', subscribe);
router.post('/contact', submitContactForm);
router.post('/services-waitlist', submitServiceWaitlist);

export default router;
