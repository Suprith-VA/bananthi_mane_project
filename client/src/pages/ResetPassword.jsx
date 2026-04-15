import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEOHead from '../components/seo/SEOHead';
import './ResetPassword.css';

const PW_MIN = 8;

function validatePw(pw) {
  if (!pw || pw.length < PW_MIN) return 'At least 8 characters required.';
  if (!/[A-Z]/.test(pw)) return 'Must contain an uppercase letter.';
  if (!/[0-9]/.test(pw)) return 'Must contain a number.';
  return null;
}

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const pwErr = validatePw(password);
    if (pwErr) { setError(pwErr); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="reset-page page-enter">
        <SEOHead title="Reset Password" noIndex />
        <div className="reset-card">
          <div className="reset-success-icon">✓</div>
          <h2>Password Reset Successful</h2>
          <p>Your password has been changed. Redirecting you to sign in…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="reset-page page-enter">
      <SEOHead title="Reset Password" noIndex />
      <div className="reset-card">
        <h2>Set New Password</h2>
        <p className="reset-subtitle">Choose a strong password for your account.</p>

        {error && <div className="reset-error">{error}</div>}

        <form className="reset-form" onSubmit={handleSubmit}>
          <label>
            New Password
            <div className="reset-pw-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 8 chars, 1 uppercase, 1 number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button type="button" className="reset-pw-toggle" onClick={() => setShowPw(v => !v)}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          {password && (
            <div className="reset-strength-row">
              {[
                { label: '8+ chars', ok: password.length >= PW_MIN },
                { label: 'Uppercase', ok: /[A-Z]/.test(password) },
                { label: 'Number', ok: /[0-9]/.test(password) },
              ].map(({ label, ok }) => (
                <span key={label} className={`pw-chip ${ok ? 'pw-ok' : 'pw-bad'}`}>{ok ? '✓' : '✗'} {label}</span>
              ))}
            </div>
          )}
          <label>
            Confirm Password
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Re-enter your new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </label>
          {confirm && password && confirm !== password && (
            <p className="reset-mismatch">Passwords do not match.</p>
          )}
          <button type="submit" className="btn reset-submit-btn" disabled={loading}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </main>
  );
}
