import { useState } from 'react';
import './Partnership.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{10,13}$/;

const CATEGORIES = [
  'Cold Pressed Oils',
  'Organic Powders',
  'Homemade Pudi',
  'Health & Wellness',
  'Food & Beverages',
  'Personal Care',
  'Other',
];

export default function Partnership() {
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    productCategories: '',
    message: '',
    website: '',
  });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.companyName.trim() || form.companyName.trim().length < 2)
      errs.companyName = 'Company/Brand name is required (min 2 characters).';
    if (!form.contactPerson.trim() || form.contactPerson.trim().length < 2)
      errs.contactPerson = 'Contact person name is required (min 2 characters).';
    if (!form.email || !EMAIL_RE.test(form.email))
      errs.email = 'Please enter a valid email address.';
    if (!form.phone || !PHONE_RE.test(form.phone.replace(/[\s\-()]/g, '')))
      errs.phone = 'Phone must be 10–13 digits.';
    if (!form.message.trim() || form.message.trim().length < 10)
      errs.message = 'Please describe your products/proposal (at least 10 characters).';
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setServerError('');

    try {
      const res = await fetch('/api/partnership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit inquiry');
      setSent(true);
      setForm({ companyName: '', contactPerson: '', email: '', phone: '', productCategories: '', message: '', website: '' });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="page-enter">
        <div className="form-layout">
          <div className="contact-success">
            <span className="contact-success-icon">✓</span>
            <h2>Inquiry Received!</h2>
            <p>
              Thank you for your interest in partnering with Bananthi Mane. Our team will review your
              proposal and get back to you within 2–3 business days.
            </p>
            <button className="btn" onClick={() => setSent(false)}>
              Submit Another Inquiry
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-enter">
      <div className="form-layout partnership-form">
        <h1>Sales & Partnership</h1>
        <p className="form-intro">
          Are you a vendor, artisan, or brand looking to sell your products through Bananthi Mane?
          We're always looking for like-minded partners who share our passion for natural, traditional,
          and handcrafted wellness products. Fill out the form below and let's explore how we can
          collaborate.
        </p>

        {serverError && <div className="partnership-error">{serverError}</div>}

        <form onSubmit={submit} noValidate>
          <div className="input-group">
            <div className="field-wrap">
              <input
                type="text"
                name="companyName"
                placeholder="Company / Brand Name *"
                value={form.companyName}
                onChange={handle}
                className={errors.companyName ? 'input-error' : ''}
              />
              {errors.companyName && <span className="field-error">{errors.companyName}</span>}
            </div>
            <div className="field-wrap">
              <input
                type="text"
                name="contactPerson"
                placeholder="Contact Person Name *"
                value={form.contactPerson}
                onChange={handle}
                className={errors.contactPerson ? 'input-error' : ''}
              />
              {errors.contactPerson && <span className="field-error">{errors.contactPerson}</span>}
            </div>
          </div>

          <div className="input-group">
            <div className="field-wrap">
              <input
                type="email"
                name="email"
                placeholder="Email Address *"
                value={form.email}
                onChange={handle}
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div className="field-wrap">
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number *"
                value={form.phone}
                onChange={handle}
                className={errors.phone ? 'input-error' : ''}
              />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>
          </div>

          <div className="field-wrap">
            <select
              name="productCategories"
              value={form.productCategories}
              onChange={handle}
              className="partnership-select"
            >
              <option value="">Product Category (Optional)</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="field-wrap">
            <input
              type="url"
              name="website"
              placeholder="Website / Social Media Link (Optional)"
              value={form.website}
              onChange={handle}
            />
          </div>

          <div className="field-wrap">
            <textarea
              name="message"
              rows="5"
              placeholder="Tell us about your products and how you'd like to collaborate *"
              value={form.message}
              onChange={handle}
              className={errors.message ? 'input-error' : ''}
            />
            {errors.message && <span className="field-error">{errors.message}</span>}
          </div>

          <button type="submit" className="btn form-submit-btn" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Partnership Inquiry'}
          </button>
        </form>
      </div>
    </main>
  );
}
