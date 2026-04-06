// tests/api/setup.js
// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers used by every test file.
// Credentials are loaded from environment variables (server/.env).
// ─────────────────────────────────────────────────────────────────────────────
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });

export const BASE_URL = process.env.TEST_API_URL || "http://localhost:5001";

// ── Test personas (from env — keep credentials out of source control) ────────
export const CREDENTIALS = {
  user: {
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD,
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL,
    password: process.env.TEST_ADMIN_PASSWORD,
  },
  superAdmin: {
    email: process.env.TEST_SUPER_ADMIN_EMAIL,
    password: process.env.TEST_SUPER_ADMIN_PASSWORD,
  },
};

if (!CREDENTIALS.superAdmin.email || !CREDENTIALS.superAdmin.password) {
  throw new Error(
    'Test credentials not configured. Set TEST_SUPER_ADMIN_EMAIL, TEST_SUPER_ADMIN_PASSWORD, ' +
    'TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, TEST_USER_EMAIL, TEST_USER_PASSWORD in server/.env'
  );
}

// ── Token cache (avoids re-logging-in for every test) ─────────────────────────
const _tokenCache = {};

/**
 * Login and return a JWT token.
 * Results are cached for the duration of the process.
 */
export async function loginAs(email, password) {
  const cacheKey = `${email}::${password}`;
  if (_tokenCache[cacheKey]) return _tokenCache[cacheKey];

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = await res.json();
  if (!body.token) {
    throw new Error(
      `loginAs(${email}) failed — HTTP ${res.status}: ${body.message || JSON.stringify(body)}`
    );
  }

  _tokenCache[cacheKey] = body.token;
  return body.token;
}

/** Convenience wrappers using the seeded personas */
export const userToken = () =>
  loginAs(CREDENTIALS.user.email, CREDENTIALS.user.password);
export const adminToken = () =>
  loginAs(CREDENTIALS.admin.email, CREDENTIALS.admin.password);
export const superAdminToken = () =>
  loginAs(CREDENTIALS.superAdmin.email, CREDENTIALS.superAdmin.password);

// ── HTTP helper ───────────────────────────────────────────────────────────────

/**
 * Make an HTTP request to the API.
 *
 * @param {"GET"|"POST"|"PUT"|"DELETE"} method
 * @param {string} path   – e.g. "/api/products"
 * @param {object|null}  body   – JSON body (omit or null for GET/DELETE)
 * @param {string|null}  token  – JWT token (omit for unauthenticated requests)
 * @returns {{ status: number, body: any }}
 */
export async function api(method, path, body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const init = {
    method: method.toUpperCase(),
    headers,
  };
  if (body !== null && method !== "GET" && method !== "DELETE") {
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, init);

  let data;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, body: data };
}

/** Shorthand helpers */
export const get = (path, token) => api("GET", path, null, token);
export const post = (path, body, token) => api("POST", path, body, token);
export const put = (path, body, token) => api("PUT", path, body, token);
export const del = (path, token) => api("DELETE", path, null, token);

// ── Unique email helper ───────────────────────────────────────────────────────

/**
 * Return a unique email address for each test run.
 * Uses a timestamp so parallel runs don't collide.
 *
 * @param {string} prefix  – e.g. "register", "subscribe"
 * @returns {string}
 */
export function uniqueEmail(prefix = "test") {
  return `${prefix}.${Date.now()}@autotest.bananthi.local`;
}

// ── GST helper (must match server's 5% rate) ─────────────────────────────────
const GST_RATE = 0.05;
export function withGst(subtotal) {
  const gst = Math.round(subtotal * GST_RATE * 100) / 100;
  return Math.round((subtotal + gst) * 100) / 100;
}

// ── Sample order payload builder ──────────────────────────────────────────────

/**
 * Build a minimal valid COD order payload.
 * totalPrice is automatically computed as subtotal + 5% GST.
 *
 * @param {string} productId   – UUID of the product
 * @param {string} unitLabel   – variant label, e.g. "250ml"
 * @param {number} price       – unit price
 * @param {object} overrides   – merge into the top-level payload
 * @returns {object}
 */
export function buildCodOrder(productId, unitLabel, price, overrides = {}) {
  return {
    items: [
      {
        product: productId,
        name: "Test Product",
        unitLabel,
        price,
        quantity: 1,
        image: "/images/test.png",
      },
    ],
    totalPrice: withGst(price),
    shippingAddress: "42 Test Street, Bengaluru, Karnataka, 560001",
    guestName: "Auto Tester",
    guestEmail: uniqueEmail("order"),
    guestPhone: "9000000001",
    ...overrides,
  };
}
