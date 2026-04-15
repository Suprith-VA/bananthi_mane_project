import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import SEOHead from '../components/seo/SEOHead';
import './TrackOrder.css';

const STEPS = ['Processing', 'Packed', 'Shipped', 'Delivered'];

// Map all fulfillment statuses → which step index they represent
const STATUS_STEP_MAP = {
  Processing: 0,
  Packed: 1,
  Shipped: 2,
  'Out for Delivery': 2,  // same visual step as Shipped
  Delivered: 3,
  // Edge cases: show last-known safe step with a warning
  Stuck: 1,               // order stuck at packing/dispatch
  Failed: 1,              // delivery failed
  Cancelled: -1,
};

// For edge-case statuses, show a contextual warning message
const STATUS_WARNINGS = {
  Stuck: { icon: '⚠️', msg: 'Your order has been temporarily delayed. Our team is working to resolve this.' },
  Failed: { icon: '⚠️', msg: 'A delivery attempt was unsuccessful. Please contact us to reschedule.' },
  'Out for Delivery': { icon: '🚚', msg: 'Your order is out for delivery today!' },
};

function ProgressBar({ status }) {
  if (status === 'Cancelled') {
    return (
      <div className="track-cancelled">
        <span className="track-cancelled-icon">✕</span>
        <p>This order has been cancelled.</p>
      </div>
    );
  }

  const current = STATUS_STEP_MAP[status] ?? 0;
  const warning = STATUS_WARNINGS[status];

  return (
    <>
      {warning && (
        <div className={`track-status-notice ${status === 'Failed' || status === 'Stuck' ? 'notice-warn' : 'notice-info'}`}>
          <span>{warning.icon}</span>
          <p>{warning.msg}</p>
        </div>
      )}
      <div className="track-progress">
        {STEPS.map((step, i) => (
          <div key={step} className={`track-step ${i <= current ? 'done' : ''} ${i === current ? 'active' : ''}`}>
            <div className="track-dot">
              {i < current && <span className="checkmark">✓</span>}
              {i === current && <span className="dot-pulse" />}
            </div>
            <span className="track-label">
              {/* Show actual status label on the active step for clarity */}
              {i === current && status !== STEPS[i] ? status : step}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`track-line ${i < current ? 'done' : ''}`} />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (searchParams.get('orderId') && (searchParams.get('email') || searchParams.get('phone'))) {
      handleTrack(null);
    }
  }, []);

  const handleTrack = async (e) => {
    if (e) e.preventDefault();
    if (!orderId.trim()) { setError('Please enter an Order ID'); return; }
    if (!email.trim() && !phone.trim()) { setError('Please enter your email or phone number'); return; }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const params = new URLSearchParams();
      if (email.trim()) params.set('email', email.trim());
      if (phone.trim()) params.set('phone', phone.trim());

      const res = await fetch(`/api/orders/track/${orderId.trim()}?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Could not find order');
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyAwb = () => {
    navigator.clipboard.writeText(order.awbCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="track-order-page page-enter">
      <SEOHead
        title="Track Your Order"
        description="Track your Bananthi Mane order delivery status. Enter your Order ID and email to check where your package is."
        canonical="/track-order"
      />
      <div className="track-container">
        <div className="track-header">
          <h1>Track Your Order</h1>
          <p>Enter your Order ID and email or phone number to check your delivery status.</p>
        </div>

        <form className="track-form" onSubmit={handleTrack}>
          <div className="track-field">
            <label>Order ID</label>
            <input
              type="text"
              placeholder="e.g. 3f7a1b2c-..."
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>
          <div className="track-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="The email used during checkout"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="track-field">
            <label>Or Phone Number</label>
            <input
              type="tel"
              placeholder="Phone used during checkout"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          {error && <p className="track-error">{error}</p>}
          <button type="submit" className="btn track-btn" disabled={loading}>
            {loading ? 'Searching…' : 'Track Order'}
          </button>
        </form>

        {order && (
          <div className="track-result">
            <div className="track-meta">
              <div className="track-meta-item">
                <span className="meta-label">Order ID</span>
                <span className="meta-value mono">{order._id}</span>
              </div>
              <div className="track-meta-item">
                <span className="meta-label">Order Date</span>
                <span className="meta-value">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="track-meta-item">
                <span className="meta-label">Order Total</span>
                <span className="meta-value">₹{order.totalPrice?.toFixed(2)}</span>
              </div>
              <div className="track-meta-item">
                <span className="meta-label">Payment</span>
                <span className={`meta-value meta-badge ${order.paymentStatus === 'Paid' ? 'badge-green' : 'badge-yellow'}`}>
                  {order.paymentStatus || 'Pending'}
                </span>
              </div>
            </div>

            <div className="track-status-section">
              <h3>Delivery Status</h3>
              <ProgressBar status={order.fulfillmentStatus} />
            </div>

            {order.awbCode && (
              <div className="track-shipping-details">
                <h3>Shipment Details</h3>
                {order.courierName && (
                  <div className="shipping-row">
                    <span className="meta-label">Courier</span>
                    <span className="meta-value">{order.courierName}</span>
                  </div>
                )}
                <div className="shipping-row awb-row">
                  <span className="meta-label">AWB / Tracking No.</span>
                  <div className="awb-value-group">
                    <span className="meta-value mono">{order.awbCode}</span>
                    <button className="awb-copy-btn" onClick={copyAwb} title="Copy AWB code">
                      {copied ? (
                        <span className="copied-badge">Copied!</span>
                      ) : (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <a
                  href={`https://www.shiprocket.in/shipment-tracking/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn track-shiprocket-btn"
                >
                  Track on Shiprocket Website ↗
                </a>
                <p className="shiprocket-hint">
                  Click "Track on Shiprocket", then paste your AWB code into the tracker.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="track-footer-note">
          <p>Need help? <Link to="/contact">Contact us</Link></p>
        </div>
      </div>
    </main>
  );
}
