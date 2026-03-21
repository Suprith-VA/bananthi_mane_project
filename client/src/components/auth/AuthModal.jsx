import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './AuthModal.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePassword(pw) {
  if (!pw || pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number.';
  return null;
}

function validateForm({ isLogin, name, email, password }) {
  if (!email || !EMAIL_RE.test(email)) return 'Please enter a valid email address.';
  if (!isLogin && (!name || name.trim().length < 2)) return 'Please enter your full name (at least 2 characters).';
  if (!isLogin) {
    const pwErr = validatePassword(password);
    if (pwErr) return pwErr;
  } else {
    if (!password) return 'Password is required.';
  }
  return null;
}

function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function AuthModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear password every time the modal opens or closes
  useEffect(() => {
    setPassword('');
    setShowPassword(false);
    setError('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm({ isLogin, name, email, password });
    if (validationError) { setError(validationError); return; }

    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin
      ? { email, password }
      : { name, email, password, isSubscribedToNewsletter: newsletter };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Authentication failed');

      login(data);
      setPassword('');
      setName('');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="close-auth" onClick={onClose}>×</button>

        <h2 className="auth-header">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="auth-subtitle">
          {isLogin
            ? 'Sign in to access your orders and saved items.'
            : 'Join the Bananthi Mane community to track your postpartum wellness journey.'}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={isLogin ? 'Password' : 'Min. 8 chars, 1 uppercase, 1 number'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              <EyeIcon visible={showPassword} />
            </button>
          </div>
          {!isLogin && password && (
            <div className="pw-strength-row">
              {[
                { label: '8+ chars', ok: password.length >= 8 },
                { label: 'Uppercase', ok: /[A-Z]/.test(password) },
                { label: 'Number', ok: /[0-9]/.test(password) },
              ].map(({ label, ok }) => (
                <span key={label} className={`pw-chip ${ok ? 'pw-ok' : 'pw-bad'}`}>{ok ? '✓' : '✗'} {label}</span>
              ))}
            </div>
          )}
          {!isLogin && (
            <label className="auth-newsletter-check">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={e => setNewsletter(e.target.checked)}
              />
              Subscribe to receive updates on new products and postpartum wellness blogs.
            </label>
          )}
          <button type="submit" className="btn auth-submit-btn" disabled={loading}>
            {loading ? 'Please wait…' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? 'New to Bananthi Mane? ' : 'Already have an account? '}
          <span onClick={() => { setIsLogin(prev => !prev); reset(); }}>
            {isLogin ? 'Create an account' : 'Sign in'}
          </span>
        </div>

        {isLogin && (
          <div className="auth-forgot">
            <span onClick={async () => {
              if (!email) { setError('Enter your email address first'); return; }
              try {
                const res = await fetch('/api/auth/forgot-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email }),
                });
                const data = await res.json();
                setError('');
                alert(data.resetUrl
                  ? `Dev mode — Reset link: ${data.resetUrl}`
                  : data.message);
              } catch { setError('Request failed'); }
            }}>
              Forgot password?
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
