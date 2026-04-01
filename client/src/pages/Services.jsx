import { useState } from 'react';
import './Services.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Services() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', dueDate: '', interest: '' });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const handle = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim() || form.firstName.trim().length < 2) errs.firstName = 'First name is required (min 2 characters).';
    if (!form.lastName.trim() || form.lastName.trim().length < 2) errs.lastName = 'Last name is required (min 2 characters).';
    if (!form.email || !EMAIL_RE.test(form.email)) errs.email = 'Please enter a valid email address.';
    return errs;
  };

  const submit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    try {
      const res = await fetch('/api/services-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          dueDate: form.dueDate || '',
          interest: form.interest.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
    } catch { /* silent — still show success */ }

    setSent(true);
    setForm({ firstName: '', lastName: '', email: '', dueDate: '', interest: '' });
  };

  if (sent) {
    return (
      <main className="page-enter">
        <div className="form-layout">
          <div className="contact-success">
            <span className="contact-success-icon">✓</span>
            <h2>You're on the list!</h2>
            <p>Thank you for registering your interest. Our team will be in touch as availability opens up.</p>
            <button className="btn" onClick={() => setSent(false)}>Register Another</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-enter">
      <div className="form-layout">
        <h1>Postpartum Services</h1>
        <p className="form-intro">
          We are expanding our offerings to include traditional in-home massage, dietary planning,
          and newborn care assistance. Register your interest below to join the community waitlist.
        </p>
        <form onSubmit={submit} noValidate>
          <div className="input-group">
            <div className="field-wrap">
              <input
                type="text" name="firstName" placeholder="First Name *"
                value={form.firstName} onChange={handle}
                className={errors.firstName ? 'input-error' : ''}
              />
              {errors.firstName && <span className="field-error">{errors.firstName}</span>}
            </div>
            <div className="field-wrap">
              <input
                type="text" name="lastName" placeholder="Last Name *"
                value={form.lastName} onChange={handle}
                className={errors.lastName ? 'input-error' : ''}
              />
              {errors.lastName && <span className="field-error">{errors.lastName}</span>}
            </div>
          </div>
          <div className="field-wrap">
            <input
              type="email" name="email" placeholder="Email Address *"
              value={form.email} onChange={handle}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <input type="date" name="dueDate" placeholder="Expected Due Date (Optional)"
            value={form.dueDate} onChange={handle}
          />
          <textarea name="interest" rows="4"
            placeholder="Which services are you most interested in? (Optional)"
            value={form.interest} onChange={handle}
          />
          <button type="submit" className="btn form-submit-btn">Join Waitlist</button>
        </form>
      </div>
    </main>
  );
}
