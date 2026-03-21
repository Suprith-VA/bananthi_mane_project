import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

const API = '';

function useAdminFetch(token) {
  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const get = useCallback(async (url) => {
    const res = await fetch(`${API}${url}`, { headers: authHeaders });
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return res.json();
  }, [token]);

  const mutate = useCallback(async (url, method, body) => {
    const res = await fetch(`${API}${url}`, {
      method,
      headers: authHeaders,
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

// ─── Product Modal ──────────────────────────────────────────
function ProductModal({ product, onClose, onSave }) {
  const blank = { title: '', price: '', description: '', category: 'General', stockQuantity: 100, image: '', isActive: true, isBestseller: false };
  const [form, setForm] = useState(product ? {
    title: product.title || product.name || '',
    price: product.price || '',
    description: product.description || '',
    category: product.category || 'General',
    stockQuantity: product.stockQuantity ?? product.stock ?? 100,
    image: product.image || '',
    isActive: product.isActive ?? true,
    isBestseller: product.isBestseller ?? false,
  } : blank);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, price: Number(form.price), stockQuantity: Number(form.stockQuantity) });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{product ? 'Edit Product' : 'New Product'}</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Title *<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>Price (Rs.) *<input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
          <label>Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
          <label>Stock Quantity<input type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} /></label>
          <label>Image URL<input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></label>
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

// ─── Blog Modal ─────────────────────────────────────────────
function BlogModal({ blog, onClose, onSave }) {
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
          <label>Featured Image URL<input value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })} /></label>
          <label>Content *<textarea required rows="10" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></label>
          <label className="checkbox-label"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Published</label>
          <label className="checkbox-label"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Feature on Home Page</label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="action-btn">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Shiprocket Modal ───────────────────────────────────────
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

// ─── Main Dashboard ─────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [users, setUsers] = useState([]);

  const [editingProduct, setEditingProduct] = useState(undefined);
  const [editingBlog, setEditingBlog] = useState(undefined);
  const [shiprocketOrder, setShiprocketOrder] = useState(null);

  const { userInfo } = useAuth();
  const token = userInfo?.token;
  const { get, mutate } = useAdminFetch(token);

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

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'blogs') fetchBlogs();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  // ─── Order actions ──────────────────────────────────────
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

  // ─── Product actions ────────────────────────────────────
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

  // ─── Blog actions ───────────────────────────────────────
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

  // ─── User actions ───────────────────────────────────────
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

  // ─── Renderers ──────────────────────────────────────────
  const renderOrdersTable = () => (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total (Rs.)</th>
            <th>Payment</th>
            <th>AWB Code</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o._id}>
              <td className="mono-cell">{o._id?.slice(0, 8)}...</td>
              <td>{o.user?.name || o.guestName || 'Guest'}</td>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              <td>{o.totalPrice?.toFixed(2)}</td>
              <td>{o.paymentInfo?.paymentStatus || (o.isPaid ? 'Paid' : 'Pending')}</td>
              <td>{o.awbCode || <span className="text-muted">—</span>}</td>
              <td>
                <span className={`status-badge status-${(o.fulfillmentStatus || 'processing').toLowerCase()}`}>
                  {o.fulfillmentStatus || 'Processing'}
                </span>
              </td>
              <td className="action-cell">
                <select
                  className="action-select"
                  value={o.fulfillmentStatus || 'Processing'}
                  onChange={e => handleUpdateOrderStatus(o._id, e.target.value)}
                >
                  <option value="Processing">Processing</option>
                  <option value="Packed">Packed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <button className="action-btn action-btn-sm" onClick={() => setShiprocketOrder(o)} title="Edit tracking details">Tracking</button>
              </td>
            </tr>
          ))}
          {orders.length === 0 && !loading && (
            <tr><td colSpan="8" className="empty-cell">No orders found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderProductsTable = () => (
    <div className="admin-table-container">
      <div className="table-header-actions">
        <button className="action-btn" onClick={() => setEditingProduct(null)}>+ New Product</button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Active</th>
            <th>Home</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p._id}>
              <td>{p.title || p.name}</td>
              <td>₹{p.price}</td>
                <td>{p.category}</td>
                <td>{p.stockQuantity ?? p.stock}</td>
                <td>{p.isActive ? '✓' : '—'}</td>
                <td>{p.isBestseller ? '⭐' : '—'}</td>
                <td className="action-cell">
                <button className="action-btn action-btn-sm" onClick={() => setEditingProduct(p)}>Edit</button>
                {p.isActive && <button className="action-btn action-btn-sm action-btn-danger" onClick={() => handleDeleteProduct(p._id)}>Deactivate</button>}
              </td>
            </tr>
          ))}
          {products.length === 0 && !loading && (
            <tr><td colSpan="7" className="empty-cell">No products found.</td></tr>
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
              <td>{new Date(b.createdAt).toLocaleDateString()}</td>
              <td className="action-cell">
                <button className="action-btn action-btn-sm" onClick={() => setEditingBlog(b)}>Edit</button>
                <button className="action-btn action-btn-sm action-btn-danger" onClick={() => handleDeleteBlog(b._id)}>Delete</button>
              </td>
            </tr>
          ))}
          {blogs.length === 0 && !loading && (
            <tr><td colSpan="5" className="empty-cell">No blog posts found.</td></tr>
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

  if (!token) {
    return (
      <main className="admin-dashboard page-enter">
        <h1 style={{ color: 'red' }}>Access Denied. You must be an administrator.</h1>
      </main>
    );
  }

  return (
    <main className="admin-dashboard page-enter">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage orders, inventory, content, and users.</p>
      </div>

      <div className="admin-tabs">
        {[
          { key: 'orders', label: 'Orders & Fulfillment' },
          { key: 'products', label: 'Product Management' },
          { key: 'blogs', label: 'Blog Management' },
          { key: 'users', label: 'User Management' },
        ].map(({ key, label }) => (
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
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {loading && !error ? <p>Loading data...</p> : (
          <>
            {activeTab === 'orders' && renderOrdersTable()}
            {activeTab === 'products' && renderProductsTable()}
            {activeTab === 'blogs' && renderBlogsTable()}
            {activeTab === 'users' && renderUsersTable()}
          </>
        )}
      </div>

      {editingProduct !== undefined && (
        <ProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(undefined)}
          onSave={handleSaveProduct}
        />
      )}

      {editingBlog !== undefined && (
        <BlogModal
          blog={editingBlog}
          onClose={() => setEditingBlog(undefined)}
          onSave={handleSaveBlog}
        />
      )}

      {shiprocketOrder && (
        <ShiprocketModal
          order={shiprocketOrder}
          onClose={() => setShiprocketOrder(null)}
          onSave={handleSaveShiprocket}
        />
      )}
    </main>
  );
}
