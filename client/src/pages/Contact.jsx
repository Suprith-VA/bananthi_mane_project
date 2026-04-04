import { useState } from 'react';
import './Services.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{10,13}$/;

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handle = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters.';
    if (!form.email || !EMAIL_RE.test(form.email)) errs.email = 'Please enter a valid email address.';
    if (form.phone && !PHONE_RE.test(form.phone.replace(/[\s\-()]/g, ''))) errs.phone = 'Phone must be 10–13 digits.';
    if (!form.message.trim() || form.message.trim().length < 10) errs.message = 'Please enter a message (at least 10 characters).';
    return errs;
  };

  const submit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setServerError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send message');
      setSent(true);
      setForm({ name: '', email: '', phone: '', message: '' });
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
            <h2>Message Sent!</h2>
            <p>Thank you for reaching out. Our team will get back to you within 24 hours.</p>
            <button className="btn" onClick={() => setSent(false)}>Send Another Message</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-enter">
      <div className="form-layout">
        <h1>Contact Us</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: 1.6, textAlign: 'center' }}>
          Have a question about an order, product, or service? We'd love to hear from you.
        </p>

        <div className="contact-info-bar">
          <div className="contact-info-item">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>16/17, 5th Cross, 1st Block Akshaya Nagar, RM Nagar, Bangalore-560016</span>
          </div>
          <div className="contact-info-item">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <a href="tel:+919945690318">+91-9945690318</a>
          </div>
          <div className="contact-info-item">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <a href="mailto:sales@bananthimane.com">sales@bananthimane.com</a>
          </div>
        </div>

        <form onSubmit={submit} noValidate>
          {serverError && <div className="partnership-error">{serverError}</div>}
          <div className="input-group">
            <div className="field-wrap">
              <input
                type="text"
                name="name"
                placeholder="Full Name *"
                value={form.name}
                onChange={handle}
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
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
          </div>
          <div className="field-wrap">
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number (10 digits)"
              value={form.phone}
              onChange={handle}
              className={errors.phone ? 'input-error' : ''}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>
          <div className="field-wrap">
            <textarea
              name="message"
              rows="6"
              placeholder="How can we assist you? *"
              value={form.message}
              onChange={handle}
              className={errors.message ? 'input-error' : ''}
            />
            {errors.message && <span className="field-error">{errors.message}</span>}
          </div>
          <button type="submit" className="btn form-submit-btn" disabled={loading}>
            {loading ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      </div>

      <div className="contact-map-section">
        <iframe
          title="Bananthi Mane Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3889.123!2d77.6501!3d12.8983!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDUzJzUzLjkiTiA3N8KwMzknMDAuNCJF!5e0!3m2!1sen!2sin!4v1712224000000"
          width="100%"
          height="350"
          style={{ border: 0, display: 'block' }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </main>
  );
}
