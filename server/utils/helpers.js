import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidUUID = (str) => UUID_RE.test(str);

export const toSlug = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const hashPassword = async (plain) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

export const comparePassword = (plain, hashed) => bcrypt.compare(plain, hashed);

export const generateResetToken = () => {
  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  const expires = new Date(Date.now() + 30 * 60 * 1000);
  return { raw, hashed, expires };
};

export const hashResetToken = (raw) =>
  crypto.createHash('sha256').update(raw).digest('hex');

export const syncNameFields = ({ name, firstName, lastName }) => {
  let n = name;
  let fn = firstName;
  let ln = lastName;

  if ((!n || !n.trim()) && (fn || ln)) {
    n = [fn, ln].filter(Boolean).join(' ').trim();
  }
  if ((!fn || !fn.trim()) && n) {
    const parts = n.trim().split(' ');
    fn = parts[0];
    ln = parts.slice(1).join(' ').trim() || ln;
  }
  return { name: n, firstName: fn, lastName: ln };
};

export const syncRoleAdmin = (role, isAdmin) => {
  if (role === 'admin' || role === 'super-admin') return { role, isAdmin: true };
  if (isAdmin && role === 'user') return { role: 'admin', isAdmin: true };
  return { role: role || 'user', isAdmin: isAdmin || false };
};

export const fulfillmentToStatus = (fulfillment) => {
  const map = {
    Processing: 'processing',
    Packed: 'processing',
    Shipped: 'shipped',
    'Out for Delivery': 'shipped',
    Delivered: 'delivered',
    Cancelled: 'cancelled',
    Stuck: 'processing',
    Failed: 'cancelled',
  };
  return map[fulfillment] || 'pending';
};
