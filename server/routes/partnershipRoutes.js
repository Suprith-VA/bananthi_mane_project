import express from 'express';
import { sendPartnershipInquiryEmail } from '../services/emailService.js';

const router = express.Router();

// POST /api/partnership
router.post('/', async (req, res) => {
  try {
    const { companyName, contactPerson, email, phone, productCategories, message, website } = req.body;

    // Validation
    if (!companyName?.trim()) return res.status(400).json({ message: 'Company/Brand name is required' });
    if (!contactPerson?.trim()) return res.status(400).json({ message: 'Contact person name is required' });
    if (!email?.trim()) return res.status(400).json({ message: 'Email is required' });
    if (!phone?.trim()) return res.status(400).json({ message: 'Phone is required' });
    if (!message?.trim() || message.trim().length < 10) {
      return res.status(400).json({ message: 'Message must be at least 10 characters' });
    }

    // Send email to enquiry@banantimane.com
    await sendPartnershipInquiryEmail({
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      productCategories: productCategories || '',
      message: message.trim(),
      website: website?.trim() || '',
    });

    res.status(200).json({ message: 'Partnership inquiry submitted successfully' });
  } catch (error) {
    console.error('[Partnership Route Error]', error.message);
    res.status(500).json({ message: 'Failed to submit partnership inquiry. Please try again later.' });
  }
});

export default router;
