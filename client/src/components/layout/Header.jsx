import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';
import './Header.css';

function UserDropdown({ onAuthOpen }) {
  const { userInfo, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate('/');
  };

  if (!userInfo) {
    return (
      <div className="user-dropdown-wrap" ref={ref}>
        <button className="icon-btn" onClick={() => setOpen(o => !o)} aria-label="Account">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
        {open && (
          <div className="user-dropdown">
            <button className="dropdown-item dropdown-item-primary" onClick={() => { close(); onAuthOpen(); }}>
              Sign In / Create Account
            </button>
            <div className="dropdown-divider" />
            <Link to="/track-order" className="dropdown-item" onClick={close}>
              Track Your Order
            </Link>
          </div>
        )}
      </div>
    );
  }

  const firstName = userInfo.firstName || userInfo.name?.split(' ')[0] || 'My Account';

  return (
    <div className="user-dropdown-wrap" ref={ref}>
      <button className="user-trigger" onClick={() => setOpen(o => !o)}>
        <span className="user-avatar">{firstName[0].toUpperCase()}</span>
        <span className="user-trigger-name">{firstName}</span>
        {isAdmin && <span className="admin-pill">{userInfo?.role === 'super-admin' ? 'Super Admin' : 'Admin'}</span>}
        <svg className="chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="user-dropdown">
          <div className="dropdown-greeting">
            <p className="dropdown-name">{userInfo.name || firstName}</p>
            <p className="dropdown-email">{userInfo.email}</p>
          </div>
          <div className="dropdown-divider" />
          <Link to="/profile" className="dropdown-item" onClick={close}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            My Profile
          </Link>
          <Link to="/orders" className="dropdown-item" onClick={close}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Order History
          </Link>
          <Link to="/track-order" className="dropdown-item" onClick={close}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Track Your Order
          </Link>
          {isAdmin && (
            <>
              <div className="dropdown-divider" />
              <Link to="/admin" className="dropdown-item dropdown-admin-link" onClick={close}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Admin Dashboard
              </Link>
            </>
          )}
          <div className="dropdown-divider" />
          <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { totalItems } = useCart();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const handleNavClick = () => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  const navLinks = [
    { to: '/',         label: 'Home'     },
    { to: '/about',    label: 'About Us' },
    { to: '/products', label: 'Products' },
    { to: '/services', label: 'Services' },
    { to: '/blog',     label: 'Blog'     },
    { to: '/contact',  label: 'Contact'  },
  ];

  const isActive = (to) => {
    if (to === '/') return pathname === '/';
    return pathname.startsWith(to);
  };

  return (
    <>
      <header className="site-header">
        <Link to="/" className="logo" onClick={handleNavClick}>
          <img src="/name_logo.png" alt="Bananthi Mane" className="logo-img" />
        </Link>

        <nav className="main-nav">
          <ul>
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className={isActive(to) ? 'active' : ''} onClick={handleNavClick}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header-icons">
          <UserDropdown onAuthOpen={() => setAuthOpen(true)} />

          <Link to="/cart" className="cart-icon-wrapper" aria-label="Cart" onClick={handleNavClick}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>

          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>

        {menuOpen && (
          <div className="mobile-nav-overlay" onClick={() => setMenuOpen(false)}>
            <nav className="mobile-nav" onClick={e => e.stopPropagation()}>
              <ul>
                {navLinks.map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className={isActive(to) ? 'active' : ''} onClick={handleNavClick}>{label}</Link>
                  </li>
                ))}
                <li><Link to="/profile" className={isActive('/profile') ? 'active' : ''} onClick={handleNavClick}>My Account</Link></li>
                <li><Link to="/orders" className={isActive('/orders') ? 'active' : ''} onClick={handleNavClick}>Order History</Link></li>
                <li><Link to="/track-order" className={isActive('/track-order') ? 'active' : ''} onClick={handleNavClick}>Track Order</Link></li>
              </ul>
            </nav>
          </div>
        )}
      </header>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
