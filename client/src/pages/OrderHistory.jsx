import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEOHead from '../components/seo/SEOHead';
import './OrderHistory.css';

const STATUS_CLASS = {
  Processing: 'status-processing',
  Packed: 'status-packed',
  Shipped: 'status-shipped',
  Delivered: 'status-delivered',
  Cancelled: 'status-cancelled',
};

export default function OrderHistory() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userInfo) return;
    fetchOrders();
  }, [userInfo]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/mine', {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = (order) => {
    const params = new URLSearchParams({
      orderId: order._id,
      email: userInfo.email,
    });
    navigate(`/track-order?${params}`);
  };

  if (!userInfo) {
    return (
      <main className="order-history-page page-enter">
        <SEOHead title="Order History" noIndex />
        <div className="oh-container">
          <p>Please <Link to="/" className="link-terracotta">sign in</Link> to view your order history.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="order-history-page page-enter">
      <SEOHead title="Order History" noIndex />
      <div className="oh-container">
        <div className="oh-header">
          <h1>Order History</h1>
          <p>All your past orders with Bananthi Mane.</p>
        </div>

        {loading && <p className="oh-loading">Loading your orders…</p>}
        {error && <p className="oh-error">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <div className="oh-empty">
            <p>You haven't placed any orders yet.</p>
            <Link to="/products" className="btn oh-shop-btn">Shop Now</Link>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="oh-list">
            {orders.map((order) => {
              const statusKey = order.fulfillmentStatus || 'Processing';
              const items = order.items || order.orderItems || [];
              return (
                <div key={order._id} className="oh-card">
                  <div className="oh-card-header">
                    <div className="oh-id-date">
                      <span className="oh-id">Order #{order._id?.slice(0, 8).toUpperCase()}</span>
                      <span className="oh-date">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="oh-right">
                      <span className={`oh-badge ${STATUS_CLASS[statusKey] || 'status-processing'}`}>
                        {statusKey}
                      </span>
                      <span className="oh-total">₹{order.totalPrice?.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="oh-items">
                    {items.slice(0, 3).map((item, i) => (
                      <div key={i} className="oh-item-row">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="oh-item-img" />
                        )}
                        <div className="oh-item-info">
                          <span className="oh-item-name">{item.name}</span>
                          <span className="oh-item-meta">Qty: {item.quantity || item.qty} · ₹{item.price}</span>
                        </div>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <p className="oh-more">+{items.length - 3} more item{items.length - 3 > 1 ? 's' : ''}</p>
                    )}
                  </div>

                  <div className="oh-card-footer">
                    <div className="oh-payment">
                      <span className={`oh-pay-badge ${order.paymentInfo?.paymentStatus === 'Paid' ? 'badge-green' : 'badge-yellow'}`}>
                        {order.paymentInfo?.paymentStatus || 'Pending'}
                      </span>
                      <span className="oh-method">{order.paymentInfo?.paymentMethod || 'COD'}</span>
                    </div>
                    <button
                      className="oh-track-btn"
                      onClick={() => handleTrack(order)}
                    >
                      {statusKey === 'Shipped' || statusKey === 'Delivered' ? 'Track Shipment' : 'View Status'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
