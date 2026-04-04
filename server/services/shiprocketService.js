const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken = null;
let tokenExpiresAt = 0;

// Shiprocket tokens are valid for 10 days; we refresh at 9 days.
const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  console.log('[Shiprocket] Authenticating with', process.env.SHIPROCKET_EMAIL);

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  if (!res.ok) {
    // Invalidate any stale cached token
    cachedToken = null;
    tokenExpiresAt = 0;
    const err = await res.json().catch(() => ({}));
    console.error(`[Shiprocket] Auth failed (${res.status}):`, JSON.stringify(err));
    throw new Error(`Shiprocket auth failed: ${err.message || res.statusText}`);
  }

  const data = await res.json();
  cachedToken = data.token;
  tokenExpiresAt = Date.now() + TOKEN_TTL_MS;
  console.log('[Shiprocket] Auth token refreshed');
  return cachedToken;
}

async function shiprocketFetch(path, options = {}) {
  const token = await getToken();
  const url = `${BASE_URL}${path}`;
  const method = options.method || 'GET';

  console.log(`[Shiprocket] ${method} ${url}`);

  const res = await fetch(url, {
    ...options,
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error('[Shiprocket] Error response:', JSON.stringify(body, null, 2));
    const msg = body.message || body.errors || res.statusText;
    throw new Error(`Shiprocket API error (${res.status}): ${typeof msg === 'object' ? JSON.stringify(msg) : msg}`);
  }

  console.log(`[Shiprocket] Response:`, JSON.stringify(body, null, 2));
  return body;
}

/**
 * Create an ad-hoc order on Shiprocket.
 * Expects a fully formed order from our DB (with items, shipping address, etc.)
 */
export async function createShiprocketOrder(order) {
  const addr = order.shippingAddress || {};
  const customerName = addr.name || order.guestName || order.user?.name || 'Customer';
  const customerPhone = addr.phone || order.guestPhone || order.user?.phone || '';
  const customerEmail = order.guestEmail || order.user?.email || '';

  const items = (order.items || []).map((item) => ({
    name: item.name,
    sku: `${item.productId || 'ITEM'}-${(item.unitLabel || 'base').replace(/\s+/g, '')}`,
    units: item.quantity,
    selling_price: item.price,
    discount: 0,
    tax: 0,
    hsn: '',
  }));

  const totalWeight = Math.max(0.5, items.reduce((s, i) => s + i.units * 0.3, 0));

  const payload = {
    order_id: order.id,
    order_date: new Date(order.createdAt).toISOString().split('T')[0],
    pickup_location: 'Primary',
    billing_customer_name: customerName.split(' ')[0],
    billing_last_name: customerName.split(' ').slice(1).join(' ') || '',
    billing_address: addr.address || '',
    billing_city: addr.city || '',
    billing_pincode: addr.pincode || '',
    billing_state: addr.state || '',
    billing_country: 'India',
    billing_email: customerEmail,
    billing_phone: customerPhone,
    shipping_is_billing: true,
    order_items: items,
    payment_method: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
    sub_total: order.totalPrice,
    length: 20,
    breadth: 15,
    height: 10,
    weight: totalWeight,
  };

  return shiprocketFetch('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function assignAWB(shipmentId) {
  return shiprocketFetch('/courier/assign/awb', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: shipmentId }),
  });
}

/**
 * Request pickup from courier after AWB is assigned.
 * This is the CRITICAL missing step — without it orders sit in limbo on Shiprocket.
 */
export async function requestPickup(shipmentId) {
  return shiprocketFetch('/courier/generate/pickup', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: [Number(shipmentId)] }),
  });
}

/**
 * Generate shipping manifest (label) for a shipment.
 */
export async function generateManifest(shipmentId) {
  return shiprocketFetch('/manifests/generate', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: [Number(shipmentId)] }),
  });
}

export async function cancelShiprocketOrder(orderIds) {
  return shiprocketFetch('/orders/cancel', {
    method: 'POST',
    body: JSON.stringify({ ids: Array.isArray(orderIds) ? orderIds : [orderIds] }),
  });
}

/**
 * Cancel assigned shipments by AWB codes.
 * Must be called BEFORE cancelShiprocketOrder if AWB was already assigned.
 */
export async function cancelShipment(awbCodes) {
  return shiprocketFetch('/orders/cancel/shipment/awbs', {
    method: 'POST',
    body: JSON.stringify({ awbs: Array.isArray(awbCodes) ? awbCodes : [awbCodes] }),
  });
}

export async function trackShipment(awbCode) {
  return shiprocketFetch(`/courier/track/awb/${awbCode}`);
}

export default {
  createShiprocketOrder,
  assignAWB,
  requestPickup,
  generateManifest,
  cancelShiprocketOrder,
  cancelShipment,
  trackShipment,
};
