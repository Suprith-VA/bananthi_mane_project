import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

export default function Profile() {
  const { userInfo, login, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('details');
  const [form, setForm] = useState({
    firstName: userInfo?.firstName || '',
    lastName: userInfo?.lastName || '',
    phone: userInfo?.phone || '',
    isSubscribedToNewsletter: userInfo?.isSubscribedToNewsletter ?? true,
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [error, setError] = useState('');

  if (!userInfo) {
    return (
      <main className="profile-page page-enter">
        <div className="profile-container">
          <p>Please <Link to="/" className="link-terracotta">sign in</Link> to view your profile.</p>
        </div>
      </main>
    );
  }

  const validateSave = () => {
    if (form.phone && !/^\+?[0-9]{10,13}$/.test(form.phone.replace(/[\s\-()]/g, ''))) {
      return 'Phone number must be 10–13 digits.';
    }
    if (!form.firstName?.trim() && !form.lastName?.trim()) {
      return 'Please enter at least a first or last name.';
    }
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const err = validateSave();
    if (err) { setError(err); return; }
    setSaving(true);
    setError('');
    setSaveMsg('');
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      login({ ...data, token: userInfo.token });
      setSaveMsg('Profile updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    setError('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!/[A-Z]/.test(pwForm.newPassword)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[0-9]/.test(pwForm.newPassword)) {
      setError('Password must contain at least one number.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify({ password: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Password change failed');
      login({ ...data, token: userInfo.token });
      setPwMsg('Password changed successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <main className="profile-page page-enter">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {(userInfo.firstName || userInfo.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1>{userInfo.name || `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim()}</h1>
            <p className="profile-email">{userInfo.email}</p>
            {userInfo.isAdmin && <span className="profile-role-badge">Admin</span>}
          </div>
        </div>

        <nav className="profile-tabs">
          <button className={tab === 'details' ? 'active' : ''} onClick={() => setTab('details')}>Personal Info</button>
          <button className={tab === 'security' ? 'active' : ''} onClick={() => setTab('security')}>Password</button>
          <button className={tab === 'preferences' ? 'active' : ''} onClick={() => setTab('preferences')}>Preferences</button>
        </nav>

        {error && <div className="profile-error">{error}</div>}

        {tab === 'details' && (
          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-field">
                <label>First Name</label>
                <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Last Name</label>
                <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div className="form-field">
              <label>Email Address</label>
              <input type="email" value={userInfo.email} disabled className="disabled-input" />
              <span className="field-hint">Email cannot be changed.</span>
            </div>
            <div className="form-field">
              <label>Phone Number</label>
              <input type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <span className="field-hint">10-digit Indian mobile number</span>
            </div>
            {saveMsg && <p className="success-msg">{saveMsg}</p>}
            <button type="submit" className="btn profile-save-btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        )}

        {tab === 'security' && (
          <form className="profile-form" onSubmit={handleChangePassword}>
            <div className="form-field">
              <label>New Password</label>
              <input type="password" placeholder="Min. 6 characters" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
            </div>
            <div className="form-field">
              <label>Confirm New Password</label>
              <input type="password" placeholder="Repeat new password" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required />
            </div>
            {pwMsg && <p className="success-msg">{pwMsg}</p>}
            <button type="submit" className="btn profile-save-btn" disabled={saving}>
              {saving ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        )}

        {tab === 'preferences' && (
          <div className="profile-form">
            <div className="pref-row">
              <div>
                <p className="pref-label">Newsletter Subscription</p>
                <p className="pref-hint">Receive updates about new products and postpartum wellness blogs.</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={form.isSubscribedToNewsletter}
                  onChange={async (e) => {
                    const val = e.target.checked;
                    setForm({ ...form, isSubscribedToNewsletter: val });
                    try {
                      const res = await fetch('/api/users/profile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` },
                        body: JSON.stringify({ isSubscribedToNewsletter: val }),
                      });
                      const data = await res.json();
                      if (res.ok) login({ ...data, token: userInfo.token });
                    } catch { /* silent */ }
                  }}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            {saveMsg && <p className="success-msg">{saveMsg}</p>}
          </div>
        )}

        <div className="profile-actions">
          <Link to="/orders" className="profile-link-btn">View Order History →</Link>
          <Link to="/track-order" className="profile-link-btn">Track an Order →</Link>
          <button className="profile-logout-btn" onClick={handleLogout}>Sign Out</button>
        </div>
      </div>
    </main>
  );
}
