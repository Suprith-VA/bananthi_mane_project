import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [msg, setMsg] = useState('');

  const handleNavClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMsg('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Subscription failed');
      setStatus('success');
      setMsg(data.alreadySubscribed ? 'You are already subscribed!' : 'Thank you for subscribing!');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMsg(err.message);
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-links">
          <div className="footer-brand">
            <img src="/logo.png" alt="Bananthi Mane Logo" className="footer-main-logo" />
            <img src="/name_logo.png" alt="Bananthi Mane" className="footer-name-logo" />
          </div>
          <ul>
            <li><span className="footer-heading">Navigate</span></li>
            <li><Link to="/" onClick={handleNavClick}>Home</Link></li>
            <li><Link to="/products" onClick={handleNavClick}>Products</Link></li>
            <li><Link to="/services" onClick={handleNavClick}>Services</Link></li>
            <li><Link to="/contact" onClick={handleNavClick}>Contact</Link></li>
            <li><Link to="/track-order" onClick={handleNavClick}>Track Order</Link></li>
          </ul>
          <ul>
            <li><span className="footer-heading">Company</span></li>
            <li><Link to="/about" onClick={handleNavClick}>About Us</Link></li>
            <li><Link to="/blog" onClick={handleNavClick}>Journal</Link></li>
            <li><Link to="/return-policy" onClick={handleNavClick}>Return Policy</Link></li>
            <li><Link to="/faq" onClick={handleNavClick}>Help &amp; FAQ</Link></li>
          </ul>
        </div>

        <div className="footer-signup">
          <h3>Join Our Community</h3>
          <p className="footer-signup-text">
            Get updates on new products and postpartum wellness blogs, straight to your inbox.
          </p>
          {status === 'success' ? (
            <p className="subscribe-success">{msg}</p>
          ) : (
            <form className="signup-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={status === 'loading'}
              />
              <button type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? '…' : 'Sign up'}
              </button>
            </form>
          )}
          {status === 'error' && <p className="subscribe-error">{msg}</p>}
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Bananthi Mane. All rights reserved.</p>
      </div>
    </footer>
  );
}
