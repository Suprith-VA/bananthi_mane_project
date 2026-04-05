import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

const API = '';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { cart, totalItems, totalPrice, clearCart } = useCart();
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: userInfo?.name || '',
    email: userInfo?.email || '',
    phone: userInfo?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);
  const successRef = useRef(null);

  useEffect(() => {
    if (totalItems === 0 && !successOrder) {
      navigate('/cart');
    }
  }, [totalItems, successOrder, navigate]);

  // Scroll to top when success view is shown
  useEffect(() => {
    if (successOrder) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [successOrder]);

  const cartItems = Object.values(cart);

  const buildOrderItems = () =>
    cartItems.map((item) => ({
      product: item.productId,
      name: item.name,
      unitLabel: item.unitLabel || null,
      price: item.price,
      quantity: item.quantity,
      image: item.image || null,
    }));

  const buildShippingAddress = () => ({
    name: form.name,
    phone: form.phone,
    address: form.address,
    city: form.city,
    state: form.state,
    pincode: form.pincode,
  });

  const validate = () => {
    if (!form.name.trim()) return 'Name is required';
    if (!form.phone.trim()) return 'Phone number is required';
    if (!form.address.trim()) return 'Address is required';
    if (!form.city.trim()) return 'City is required';
    if (!form.state.trim()) return 'State is required';
    if (!form.pincode.trim()) return 'Pincode is required';
    if (!/^\d{6}$/.test(form.pincode.trim())) return 'Pincode must be 6 digits';
    if (!userInfo && !form.email.trim()) return 'Email is required for guest checkout';
    return null;
  };

  const handleCOD = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (userInfo?.token) headers.Authorization = `Bearer ${userInfo.token}`;

      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: buildOrderItems(),
          totalPrice,
          shippingAddress: buildShippingAddress(),
          guestEmail: !userInfo ? form.email : undefined,
          guestPhone: !userInfo ? form.phone : undefined,
          guestName: !userInfo ? form.name : undefined,
          paymentInfo: { paymentMethod: 'COD', paymentStatus: 'Pending' },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to place order');

      setSuccessOrder(data);
      clearCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpay = async () => {
    setLoading(true);
    setError('');
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load Razorpay. Check your internet connection.');

      const configRes = await fetch(`${API}/api/payments/config`);
      if (!configRes.ok) throw new Error('Payment service is temporarily unavailable. Please try again.');
      const { key } = await configRes.json();
      if (!key) throw new Error('Payment is not configured. Please contact support.');

      const headers = { 'Content-Type': 'application/json' };
      if (userInfo?.token) headers.Authorization = `Bearer ${userInfo.token}`;

      const orderRes = await fetch(`${API}/api/payments/create-order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount: totalPrice }),
      });
      const rzpOrder = await orderRes.json();
      if (!orderRes.ok) throw new Error(rzpOrder.message || 'Failed to create payment order');

      const options = {
        key,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: 'Bananthi Mane',
        description: 'Order Payment',
        order_id: rzpOrder.id,
        prefill: {
          name: form.name,
          email: form.email || userInfo?.email || '',
          contact: form.phone,
        },
        retry: { enabled: false },
        timeout: 900, // 15 minutes
        theme: { color: '#A2B096' },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API}/api/payments/verify`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData: {
                  items: buildOrderItems(),
                  totalPrice,
                  shippingAddress: buildShippingAddress(),
                  guestEmail: !userInfo ? form.email : undefined,
                  guestPhone: !userInfo ? form.phone : undefined,
                  guestName: !userInfo ? form.name : undefined,
                },
              }),
            });

            const data = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(data.message || 'Payment verification failed');

            setSuccessOrder(data);
            clearCart();
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError('Payment was cancelled.');
          },
        },
      };

      const rzp = new window.Razorpay(options);

      // Capture the REAL Razorpay failure reason (error code + description)
      rzp.on('payment.failed', (resp) => {
        const meta = resp.error || {};
        const reason = meta.description || meta.reason || 'Payment failed';
        const code = meta.code || '';
        console.error('[Razorpay payment.failed]', JSON.stringify(meta, null, 2));
        setError(`Payment failed: ${reason}${code ? ` (${code})` : ''}`);
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handlePlaceOrder = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');

    if (paymentMethod === 'COD') {
      handleCOD();
    } else {
      handleRazorpay();
    }
  };

  if (successOrder) {
    return (
      <main className="page-enter checkout-page">
        <div className="checkout-success">
          <h2>Order Placed Successfully!</h2>
          <p>Thank you for your order.</p>
          <p className="order-id-display">Order ID: {successOrder._id}</p>
          <p>
            Payment: <strong>{successOrder.paymentInfo?.paymentMethod}</strong>
            {' — '}
            {successOrder.isPaid ? 'Paid' : 'Pending (Pay on delivery)'}
          </p>
          <div className="checkout-success-actions">
            <Link to="/products" className="btn">Continue Shopping</Link>
            {userInfo && <Link to="/orders" className="btn btn-outline">My Orders</Link>}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-enter checkout-page">
      <div className="page-header">
        <h1>Checkout</h1>
      </div>

      <div className="checkout-layout">
        <div>
          {/* Shipping Address */}
          <div className="checkout-section">
            <h2>Shipping Address</h2>
            {error && <div className="checkout-error">{error}</div>}
            <div className="checkout-form">
              <div className="checkout-form-row">
                <label>
                  Full Name *
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name"
                    required
                  />
                </label>
                <label>
                  Phone *
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="10-digit phone"
                    required
                  />
                </label>
              </div>

              {!userInfo && (
                <label>
                  Email *
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                    required
                  />
                </label>
              )}

              <label>
                Address *
                <textarea
                  rows="2"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="House/Flat no., Street, Locality"
                  required
                />
              </label>

              <div className="checkout-form-row">
                <label>
                  City *
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                    required
                  />
                </label>
                <label>
                  State *
                  <input
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="State"
                    required
                  />
                </label>
              </div>

              <label>
                Pincode *
                <input
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="6-digit pincode"
                  maxLength={6}
                  required
                />
              </label>
            </div>
          </div>

          {/* Payment Method */}
          <div className="checkout-section" style={{ marginTop: '1.5rem' }}>
            <h2>Payment Method</h2>
            <div className="payment-methods">
              <label className={`payment-option ${paymentMethod === 'Razorpay' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="Razorpay"
                  checked={paymentMethod === 'Razorpay'}
                  onChange={() => setPaymentMethod('Razorpay')}
                />
                <div className="payment-option-info">
                  <span className="payment-option-title">Pay Online (Razorpay)</span>
                  <span className="payment-option-desc">UPI, Cards, Netbanking, Wallets</span>
                </div>
              </label>

              <label className={`payment-option ${paymentMethod === 'COD' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                />
                <div className="payment-option-info">
                  <span className="payment-option-title">Cash on Delivery</span>
                  <span className="payment-option-desc">Pay when you receive the order</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="checkout-summary">
          <h2>Order Summary</h2>
          <div className="checkout-summary-items">
            {cartItems.map((item, i) => (
              <div key={i} className="checkout-summary-item">
                <div>
                  <span className="checkout-summary-item-name">{item.name}</span>
                  {item.unitLabel && (
                    <span className="checkout-summary-item-unit"> — {item.unitLabel}</span>
                  )}
                  <span className="checkout-summary-item-qty"> x{item.quantity}</span>
                </div>
                <span>Rs. {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="checkout-summary-total">
            <span>Total</span>
            <span>Rs. {totalPrice.toFixed(2)}</span>
          </div>
          <button
            className="checkout-btn"
            onClick={handlePlaceOrder}
            disabled={loading || totalItems === 0}
          >
            {loading
              ? 'Processing...'
              : paymentMethod === 'COD'
                ? `Place Order (COD) — Rs. ${totalPrice.toFixed(2)}`
                : `Pay Rs. ${totalPrice.toFixed(2)}`
            }
          </button>
        </div>
      </div>
    </main>
  );
}
