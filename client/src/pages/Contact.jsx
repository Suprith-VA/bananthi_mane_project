import { useState } from 'react';
import './Services.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{10,13}$/;

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

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

  const submit = e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    // TODO: wire to backend contact endpoint when available
    setSent(true);
    setForm({ name: '', email: '', phone: '', message: '' });
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
        <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Have a question about an order, product, or service? We'd love to hear from you.
        </p>
        <form onSubmit={submit} noValidate>
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
          <button type="submit" className="btn form-submit-btn">Send Message</button>
        </form>
      </div>
    </main>
  );
}
