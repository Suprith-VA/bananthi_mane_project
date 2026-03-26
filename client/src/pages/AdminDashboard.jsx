import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ImageUploadField from '../components/admin/ImageUploadField';
import './AdminDashboard.css';

const PRODUCT_CATEGORIES = ['Cold Pressed Oil', 'Organic Powders', 'Homemade Pudi', 'Other'];

const API = '';

function useAdminFetch(token) {
  const get = useCallback(async (url) => {
    const res = await fetch(`${API}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to fetch ${url}`);
    }
    return res.json();
  }, [token]);

  const mutate = useCallback(async (url, method, body) => {
    const res = await fetch(`${API}${url}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Request failed');
    }
    return res.json();
  }, [token]);

  return { get, mutate };
}

/* ══════════════════════════════════════════════════════════════
   Modals
   ══════════════════════════════════════════════════════════════ */

function ProductModal({ product, onClose, onSave, token }) {
  const blank = {
    title: '', price: '', description: '', category: 'Cold Pressed Oil',
    stockQuantity: 100, image: '', isActive: true, isBestseller: false,
  };
  const [form, setForm] = useState(product ? {
    title: product.title || product.name || '',
    price: product.price || '',
    description: product.description || '',
    category: product.category || 'Cold Pressed Oil',
    stockQuantity: product.stockQuantity ?? product.stock ?? 100,
    image: product.image || '',
    isActive: product.isActive ?? true,
    isBestseller: product.isBestseller ?? false,
  } : blank);
  const [err, setErr] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.image.trim()) { setErr('Image is required — upload a file or paste a URL.'); return; }
    setErr('');
    onSave({ ...form, price: Number(form.price), stockQuantity: Number(form.stockQuantity) });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{product ? 'Edit Product' : 'New Product'}</h2>
        {err && <p className="modal-error">{err}</p>}
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Title *<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>Price (₹) *<input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
          <label>Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>Stock Quantity<input type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} /></label>
          <label>Image *
            <ImageUploadField
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
              token={token}
            />
          </label>
          <label>Description<textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="checkbox-label"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
          <label className="checkbox-label"><input type="checkbox" checked={form.isBestseller} onChange={(e) => setForm({ ...form, isBestseller: e.target.checked })} /> Show in Bestsellers (Home Page)</label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="action-btn">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BlogModal({ blog, onClose, onSave, token }) {
  const [form, setForm] = useState(blog ? {
    title: blog.title || '',
    content: blog.content || '',
    featuredImage: blog.featuredImage || '',
    isPublished: blog.isPublished ?? false,
    isFeatured: blog.isFeatured ?? false,
  } : { title: '', content: '', featuredImage: '', isPublished: false, isFeatured: false });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>{blog ? 'Edit Blog Post' : 'New Blog Post'}</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Title *<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>Featured Image
            <ImageUploadField
              value={form.featuredImage}
              onChange={(url) => setForm({ ...form, featuredImage: url })}
              token={token}
            />
          </label>
          <label>Content *<textarea required rows="10" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></label>
          <label className="checkbox-label"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Published</label>
          <label className="checkbox-label"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Feature on Home Page (replaces current featured)</label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="action-btn">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ShiprocketModal({ order, onClose, onSave }) {
  const [form, setForm] = useState({
    shiprocketOrderId: order.shiprocketOrderId || '',
    shipmentId: order.shipmentId || '',
    awbCode: order.awbCode || '',
    courierName: order.courierName || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Shiprocket / Tracking Details</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Shiprocket Order ID<input value={form.shiprocketOrderId} onChange={(e) => setForm({ ...form, shiprocketOrderId: e.target.value })} /></label>
          <label>Shipment ID<input value={form.shipmentId} onChange={(e) => setForm({ ...form, shipmentId: e.target.value })} /></label>
          <label>AWB Code (Tracking Number)<input value={form.awbCode} onChange={(e) => setForm({ ...form, awbCode: e.target.value })} /></label>
          <label>Courier Name<input value={form.courierName} onChange={(e) => setForm({ ...form, courierName: e.target.value })} /></label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="action-btn">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentModal({ order, onClose, onSave }) {
  const [form, setForm] = useState({
    paymentStatus: order.paymentInfo?.paymentStatus || (order.isPaid ? 'Paid' : 'Pending'),
    paymentMethod: order.paymentInfo?.paymentMethod || 'COD',
    isPaid: order.isPaid ?? false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Payment Details</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Payment Status
            <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Refunded">Refunded</option>
              <option value="Failed">Failed</option>
            </select>
          </label>
          <label>Payment Method
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              <option value="COD">Cash on Delivery</option>
              <option value="Razorpay">Razorpay</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.isPaid} onChange={(e) => setForm({ ...form, isPaid: e.target.checked, paymentStatus: e.target.checked ? 'Paid' : 'Pending' })} /> Mark as Paid
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="action-btn">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrderDetailModal({ order, onClose }) {
  if (!order) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>Order Details</h2>
        <div className="order-detail-grid">
          <div className="od-row"><strong>Order ID</strong><span className="mono-cell">{order._id}</span></div>
          <div className="od-row"><strong>Customer</strong><span>{order.user?.name || order.guestName || 'Guest'}</span></div>
          <div className="od-row"><strong>Email</strong><span>{order.user?.email || order.guestEmail || '—'}</span></div>
          <div className="od-row"><strong>Phone</strong><span>{order.user?.phone || order.guestPhone || '—'}</span></div>
          <div className="od-row"><strong>Date</strong><span>{new Date(order.createdAt).toLocaleString()}</span></div>
          <div className="od-row"><strong>Status</strong><span className={`status-badge status-${(order.fulfillmentStatus || 'processing').toLowerCase().replace(/ /g, '-')}`}>{order.fulfillmentStatus}</span></div>
          <div className="od-row"><strong>Payment</strong><span>{order.paymentInfo?.paymentStatus} ({order.paymentInfo?.paymentMethod})</span></div>
          <div className="od-row"><strong>Total</strong><span>₹{order.totalPrice?.toFixed(2)}</span></div>
          {order.awbCode && <div className="od-row"><strong>AWB Code</strong><span className="mono-cell">{order.awbCode}</span></div>}
          {order.courierName && <div className="od-row"><strong>Courier</strong><span>{order.courierName}</span></div>}
        </div>

        <h3 style={{ margin: '1.2rem 0 0.6rem' }}>Items</h3>
        <table className="admin-table">
          <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
          <tbody>
            {(order.items || order.orderItems || []).map((item, i) => (
              <tr key={i}>
                <td>{item.name}</td>
                <td>{item.qty || item.quantity}</td>
                <td>₹{item.price}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {order.shippingAddress && (
          <>
            <h3 style={{ margin: '1.2rem 0 0.6rem' }}>Shipping Address</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
              {typeof order.shippingAddress === 'string'
                ? order.shippingAddress
                : JSON.stringify(order.shippingAddress, null, 2)}
            </p>
          </>
        )}

        <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Role helpers
   ══════════════════════════════════════════════════════════════ */
const ADMIN_FULFILLMENT_OPTIONS = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Stuck', 'Failed', 'Cancelled'];
const SUPER_ADMIN_FULFILLMENT_OPTIONS = [...ADMIN_FULFILLMENT_OPTIONS];

/* ══════════════════════════════════════════════════════════════
   Main Dashboard
   ══════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { userInfo } = useAuth();
  const token = userInfo?.token;
  const role = userInfo?.role || 'user';
  const isSuperAdmin = role === 'super-admin';

  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [subscribers, setSubscribers] = useState([]);

  const [editingProduct, setEditingProduct] = useState(undefined);
  const [editingBlog, setEditingBlog] = useState(undefined);
  const [shiprocketOrder, setShiprocketOrder] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);

  const { get, mutate } = useAdminFetch(token);

  /* ── Data fetchers ─────────────────────────────────────── */
  const fetchStats = useCallback(async () => {
    try { setStats(await get('/api/admin/stats')); } catch { /* silent */ }
  }, [get]);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try { setOrders(await get('/api/orders')); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [get]);

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError(null);
    try { setProducts(await get('/api/products?includeInactive=true')); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [get]);

  const fetchBlogs = useCallback(async () => {
    setLoading(true); setError(null);
    try { setBlogs(await get('/api/blogs/admin/all')); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [get]);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try { setUsers(await get('/api/admin/users')); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [get]);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSubscribers(await get('/api/admin/subscribers')); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [get]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'blogs') fetchBlogs();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'subscribers') fetchSubscribers();
  }, [activeTab]);

  /* ── Order actions ─────────────────────────────────────── */
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await mutate(`/api/orders/${orderId}/status`, 'PUT', { fulfillmentStatus: newStatus });
      fetchOrders();
    } catch (err) { alert(err.message); }
  };

  const handleSaveShiprocket = async (data) => {
    try {
      await mutate(`/api/orders/${shiprocketOrder._id}/shiprocket`, 'PUT', data);
      setShiprocketOrder(null);
      fetchOrders();
    } catch (err) { alert(err.message); }
  };

  const handleSavePayment = async (data) => {
    try {
      await mutate(`/api/orders/${paymentOrder._id}/payment`, 'PUT', data);
      setPaymentOrder(null);
      fetchOrders();
    } catch (err) { alert(err.message); }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Cancel this order? Stock will be restored.')) return;
    try {
      await mutate(`/api/orders/${orderId}`, 'DELETE');
      fetchOrders();
      // Silently refresh products so stock count is updated when admin switches to Products tab
      fetchProducts();
    } catch (err) { alert(err.message); }
  };

  /* ── Product actions (super-admin only) ────────────────── */
  const handleSaveProduct = async (data) => {
    try {
      if (editingProduct?._id) {
        await mutate(`/api/products/${editingProduct._id}`, 'PUT', data);
      } else {
        await mutate('/api/products', 'POST', data);
      }
      setEditingProduct(undefined);
      fetchProducts();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Deactivate this product?')) return;
    try {
      await mutate(`/api/products/${id}`, 'DELETE');
      fetchProducts();
    } catch (err) { alert(err.message); }
  };

  const handleReactivateProduct = async (id) => {
    try {
      await mutate(`/api/products/${id}`, 'PUT', { isActive: true });
      fetchProducts();
    } catch (err) { alert(err.message); }
  };

  /* ── Blog actions (admin + super-admin) ────────────────── */
  const handleSaveBlog = async (data) => {
    try {
      if (editingBlog?._id) {
        await mutate(`/api/blogs/${editingBlog._id}`, 'PUT', data);
      } else {
        await mutate('/api/blogs', 'POST', data);
      }
      setEditingBlog(undefined);
      fetchBlogs();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteBlog = async (id) => {
    if (!confirm('Delete this blog post permanently?')) return;
    try {
      await mutate(`/api/blogs/${id}`, 'DELETE');
      fetchBlogs();
    } catch (err) { alert(err.message); }
  };

  /* ── User actions (super-admin only) ───────────────────── */
  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await mutate(`/api/admin/users/${userId}`, 'PUT', { role: newRole });
      fetchUsers();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await mutate(`/api/admin/users/${userId}`, 'DELETE');
      fetchUsers();
    } catch (err) { alert(err.message); }
  };

  /* ── Subscriber actions ────────────────────────────────── */
  const handleDeleteSubscriber = async (subId) => {
    if (!confirm('Remove this subscriber?')) return;
    try {
      await mutate(`/api/admin/subscribers/${subId}`, 'DELETE');
      fetchSubscribers();
    } catch (err) { alert(err.message); }
  };

  const handleComposeNewsletter = async () => {
    try {
      const data = await get('/api/admin/subscribers/emails');
      const emails = data.emails || [];
      if (emails.length === 0) { alert('No active subscribers found.'); return; }
      const bcc = emails.join(',');
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(bcc)}&su=${encodeURIComponent('Newsletter from Bananthi Mane')}`, '_blank');
    } catch (err) { alert(err.message); }
  };

  /* ── Tab config based on role ──────────────────────────── */
  const tabs = [
    { key: 'orders', label: 'Orders' },
    { key: 'products', label: 'Products' },
    { key: 'blogs', label: 'Blogs' },
    { key: 'subscribers', label: 'Subscribers' },
    ...(isSuperAdmin ? [{ key: 'users', label: 'Users' }] : []),
  ];

  /* ══════════════════════════════════════════════════════════
     Table Renderers
     ══════════════════════════════════════════════════════════ */

  const renderStats = () => {
    if (!stats) return null;
    const cards = [
      { label: 'Orders', value: stats.orders, color: '#0c5460' },
      { label: 'Products', value: stats.products, color: '#155724' },
      { label: 'Blogs', value: stats.blogs, color: '#856404' },
      { label: 'Users', value: stats.users, color: '#3b3d8e' },
      { label: 'Subscribers', value: stats.subscribers, color: '#6b4226' },
    ];
    return (
      <div className="stats-row">
        {cards.map((c) => (
          <div key={c.label} className="stat-card" style={{ borderTopColor: c.color }}>
            <span className="stat-value">{c.value}</span>
            <span className="stat-label">{c.label}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderOrdersTable = () => {
    const statusOptions = isSuperAdmin ? SUPER_ADMIN_FULFILLMENT_OPTIONS : ADMIN_FULFILLMENT_OPTIONS;
    return (
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Payment</th>
              <th>AWB</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => {
              const fs = (o.fulfillmentStatus || 'Processing').toLowerCase().replace(/ /g, '-');
              return (
                <tr key={o._id}>
                  <td className="mono-cell clickable" onClick={() => setViewingOrder(o)}>{o._id?.slice(0, 8)}...</td>
                  <td>{o.user?.name || o.guestName || 'Guest'}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>₹{o.totalPrice?.toFixed(2)}</td>
                  <td>
                    <span className={`pay-badge pay-${(o.paymentInfo?.paymentStatus || 'Pending').toLowerCase()}`}>
                      {o.paymentInfo?.paymentStatus || (o.isPaid ? 'Paid' : 'Pending')}
                    </span>
                  </td>
                  <td>{o.awbCode || <span className="text-muted">—</span>}</td>
                  <td><span className={`status-badge status-${fs}`}>{o.fulfillmentStatus || 'Processing'}</span></td>
                  <td className="action-cell">
                    <select
                      className="action-select"
                      value={o.fulfillmentStatus || 'Processing'}
                      onChange={e => handleUpdateOrderStatus(o._id, e.target.value)}
                    >
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {isSuperAdmin && (
                      <>
                        <button className="action-btn action-btn-sm" onClick={() => setShiprocketOrder(o)} title="Edit tracking">Track</button>
                        <button className="action-btn action-btn-sm action-btn-pay" onClick={() => setPaymentOrder(o)} title="Edit payment">Pay</button>
                        {o.fulfillmentStatus !== 'Cancelled' && (
                          <button className="action-btn action-btn-sm action-btn-danger" onClick={() => handleCancelOrder(o._id)} title="Cancel order">Cancel</button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && !loading && (
              <tr><td colSpan="8" className="empty-cell">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderProductsTable = () => (
    <div className="admin-table-container">
      {isSuperAdmin && (
        <div className="table-header-actions">
          <button className="action-btn" onClick={() => setEditingProduct(null)}>+ New Product</button>
        </div>
      )}
      {!isSuperAdmin && (
        <div className="role-notice">
          <span>Read-only access</span> — Product management requires Super Admin privileges.
        </div>
      )}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Active</th>
            <th>Bestseller</th>
            {isSuperAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p._id} className={!p.isActive ? 'row-inactive' : ''}>
              <td><img src={p.image} alt="" className="table-thumb" onError={(e) => { e.target.src = '/images/main.png'; }} /></td>
              <td>{p.title || p.name}</td>
              <td>₹{p.price}</td>
              <td>{p.category}</td>
              <td className={p.stockQuantity === 0 ? 'text-danger' : ''}>{p.stockQuantity ?? p.stock}</td>
              <td>{p.isActive ? <span className="dot dot-green" /> : <span className="dot dot-red" />}</td>
              <td>{p.isBestseller ? '⭐' : '—'}</td>
              {isSuperAdmin && (
                <td className="action-cell">
                  <button className="action-btn action-btn-sm" onClick={() => setEditingProduct(p)}>Edit</button>
                  {p.isActive ? (
                    <button className="action-btn action-btn-sm action-btn-danger" onClick={() => handleDeleteProduct(p._id)}>Deactivate</button>
                  ) : (
                    <button className="action-btn action-btn-sm action-btn-success" onClick={() => handleReactivateProduct(p._id)}>Reactivate</button>
                  )}
                </td>
              )}
            </tr>
          ))}
          {products.length === 0 && !loading && (
            <tr><td colSpan={isSuperAdmin ? 8 : 7} className="empty-cell">No products found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderBlogsTable = () => (
    <div className="admin-table-container">
      <div className="table-header-actions">
        <button className="action-btn" onClick={() => setEditingBlog(null)}>+ New Blog Post</button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Status</th>
            <th>Featured</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {blogs.map(b => (
            <tr key={b._id}>
              <td>{b.title}</td>
              <td>{b.authorName || b.author?.name || 'Admin'}</td>
              <td>
                <span className={`status-badge ${b.isPublished ? 'status-delivered' : 'status-processing'}`}>
                  {b.isPublished ? 'Published' : 'Draft'}
                </span>
              </td>
              <td>{b.isFeatured ? '⭐' : '—'}</td>
              <td>{new Date(b.publishedAt || b.createdAt).toLocaleDateString()}</td>
              <td className="action-cell">
                <button className="action-btn action-btn-sm" onClick={() => setEditingBlog(b)}>Edit</button>
                <button className="action-btn action-btn-sm action-btn-danger" onClick={() => handleDeleteBlog(b._id)}>Delete</button>
              </td>
            </tr>
          ))}
          {blogs.length === 0 && !loading && (
            <tr><td colSpan="6" className="empty-cell">No blog posts found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderUsersTable = () => (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Newsletter</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—'}</td>
              <td>{u.email}</td>
              <td>{u.phone || '—'}</td>
              <td>
                <select
                  className="action-select"
                  value={u.role}
                  onChange={e => handleUpdateUserRole(u._id, e.target.value)}
                  disabled={u._id === userInfo?._id}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super-admin">Super Admin</option>
                </select>
              </td>
              <td>{u.isSubscribedToNewsletter ? 'Yes' : 'No'}</td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td>
                {u._id !== userInfo?._id && (
                  <button className="action-btn action-btn-sm action-btn-danger" onClick={() => handleDeleteUser(u._id)}>Remove</button>
                )}
              </td>
            </tr>
          ))}
          {users.length === 0 && !loading && (
            <tr><td colSpan="7" className="empty-cell">No users found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderSubscribersTable = () => (
    <div className="admin-table-container">
      <div className="table-header-actions">
        <button className="action-btn" onClick={handleComposeNewsletter}>
          ✉ Compose Newsletter
        </button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Source</th>
            <th>Active</th>
            <th>Subscribed On</th>
            {isSuperAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {subscribers.map(s => (
            <tr key={s._id}>
              <td>{s.email}</td>
              <td>{s.name || '—'}</td>
              <td>{s.source || 'public-subscribe'}</td>
              <td>{s.isActive ? <span className="dot dot-green" /> : <span className="dot dot-red" />}</td>
              <td>{new Date(s.createdAt).toLocaleDateString()}</td>
              {isSuperAdmin && (
                <td>
                  <button className="action-btn action-btn-sm action-btn-danger" onClick={() => handleDeleteSubscriber(s._id)}>Remove</button>
                </td>
              )}
            </tr>
          ))}
          {subscribers.length === 0 && !loading && (
            <tr><td colSpan={isSuperAdmin ? 6 : 5} className="empty-cell">No subscribers found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  /* ── Guard ─────────────────────────────────────────────── */
  if (!token || (role !== 'admin' && role !== 'super-admin' && !userInfo?.isAdmin)) {
    return (
      <main className="admin-dashboard page-enter">
        <h1 style={{ color: 'red' }}>Access Denied. You must be an administrator.</h1>
      </main>
    );
  }

  /* ── Render ────────────────────────────────────────────── */
  return (
    <main className="admin-dashboard page-enter">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p className="admin-role-chip">{isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
      </div>

      {renderStats()}

      <div className="admin-tabs">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            className={`admin-tab ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="admin-panel-content">
        {error && <p className="admin-error">Error: {error}</p>}
        {loading && !error ? <p className="admin-loading">Loading data...</p> : (
          <>
            {activeTab === 'orders' && renderOrdersTable()}
            {activeTab === 'products' && renderProductsTable()}
            {activeTab === 'blogs' && renderBlogsTable()}
            {activeTab === 'subscribers' && renderSubscribersTable()}
            {activeTab === 'users' && isSuperAdmin && renderUsersTable()}
          </>
        )}
      </div>

      {editingProduct !== undefined && isSuperAdmin && (
        <ProductModal product={editingProduct} onClose={() => setEditingProduct(undefined)} onSave={handleSaveProduct} token={token} />
      )}

      {editingBlog !== undefined && (
        <BlogModal blog={editingBlog} onClose={() => setEditingBlog(undefined)} onSave={handleSaveBlog} token={token} />
      )}

      {shiprocketOrder && isSuperAdmin && (
        <ShiprocketModal order={shiprocketOrder} onClose={() => setShiprocketOrder(null)} onSave={handleSaveShiprocket} />
      )}

      {paymentOrder && isSuperAdmin && (
        <PaymentModal order={paymentOrder} onClose={() => setPaymentOrder(null)} onSave={handleSavePayment} />
      )}

      {viewingOrder && (
        <OrderDetailModal order={viewingOrder} onClose={() => setViewingOrder(null)} />
      )}
    </main>
  );
}
