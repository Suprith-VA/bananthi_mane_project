# Bananthi Mane – API Test Suite

Automated API-level tests for the Bananthi Mane backend, built with **Vitest**.  
Tests run against a **live local server** — start the server first, then run the tests.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18 or later |
| Running API server | `http://localhost:5001` (default) |
| Seeded test accounts | Run `npm run seed` once |

---

## Quick Start

```bash
# 1 — Install test dependencies (from the project root)
npm install

# 2 — Seed the test personas into the database (once, or after DB reset)
npm run seed

# 3 — Start the API server in a separate terminal
cd server && npm run dev

# 4 — Run all API tests
npm run test:api
```

---

## All Test Scripts

| Script | What it does |
|---|---|
| `npm run test:api` | Runs all API tests once (CI mode, exits with code) |
| `npm run test:watch` | Runs tests in watch mode (re-runs on file changes) |
| `npm run seed` | Re-seeds all test personas into the database |

---

## Test Personas

These accounts are seeded into the database by `npm run seed`.  
Every test file uses these — never change these credentials without updating `tests/api/setup.js`.

| Email | Password | Role | Used For |
|---|---|---|---|
| customer.test@bananthi.local | Test@123 | user | Customer-facing endpoints, auth tests |
| admin.test@bananthi.local | Admin@1234 | admin | Admin-only endpoints, role guard tests |
| ops.test@bananthi.local | Ops@12345 | super-admin | Super-admin endpoints, product CRUD, Shiprocket |

---

## Custom API URL

If your server runs on a different port, set `TEST_API_URL` before running:

```bash
TEST_API_URL=http://localhost:5000 npm run test:api
```

---

## Test File Structure

```
tests/
├── api/
│   ├── globalSetup.js      ← Runs once before all tests. Checks server is reachable.
│   ├── setup.js            ← Shared helpers: BASE_URL, credentials, api(), loginAs(), etc.
│   ├── health.test.js      ← GET /api/health smoke test
│   ├── auth.test.js        ← Register, Login, Forgot Password
│   ├── products.test.js    ← List, detail, stock sync, CRUD, from-price, zero-stock bug
│   ├── orders.test.js      ← COD creation, tracking, stock sync (T3.2–T3.4), admin ops
│   ├── admin.test.js       ← Stats, user management, subscriber management
│   ├── blog.test.js        ← CRUD, published-only guard, slug lookup, featured rule
│   ├── marketing.test.js   ← Subscribe, contact form, services waitlist
│   └── payments.test.js    ← Razorpay config, create-order, invalid signature guard
├── MANUAL_TEST_PLAN.md     ← Manual tests for UI flows (Razorpay, Shiprocket, email)
└── README.md               ← This file
```

---

## What Each File Tests

### `health.test.js`
Single smoke test — confirms `GET /api/health` returns `{ status: "ok" }`.

### `auth.test.js`
- Register: success, duplicate email (400), missing fields (400), lowercase email storage
- Login: all three personas succeed, wrong password (401), missing email (400)
- Forgot password: registered email (200), unknown email (200 — no user enumeration)

### `products.test.js`
- Public list: only active products returned, all have variants
- Detail: by UUID, by slug, 404 for nonexistent
- **Stock sync**: `product.stockQuantity === sum of variant stocks` — always
- **From Price** (Changes 5 T13.1): `product.price === Math.min(variant prices)`
- **Zero-stock bug fix** (Changes 5 T13.4): setting variant stock to `0` saves as `0`, not `50`
- Auth guards: POST/PUT/DELETE require super-admin; user and admin (non-super) get 403
- Create validation: missing name (400), missing image (400), duplicate slug (400)
- Update and soft-delete (sets `isActive: false`)

### `orders.test.js`
- Guest COD: 201 with order ID, correct items, 400 for missing guest fields
- User COD: 201, appears in `/mine` endpoint
- Tracking: correct email (200), wrong email (403), no email (400), invalid UUID (400), by phone
- Admin list: 401 for guest, 403 for user, 200 for admin+
- Status update: 401/403 guards, admin can set Packed/Shipped/Cancelled
- Payment update: 403 for admin (non-super), super-admin can mark Paid
- **Stock sync T3.2**: order creation decrements variant + product stock
- **Stock sync T3.3**: cancellation restores stock
- **Stock sync T3.4**: reactivation re-deducts stock
- **Out-of-stock guard T3.5**: API rejects order when variant stock is 0
- Cancel (DELETE): restores stock, 400 on double-cancel, 403 for admin (non-super)
- Multi-item order (T11.1): 2 line items, correct total

### `admin.test.js`
- Stats: 401/403 guards, admin and super-admin both get 200 with correct shape
- User list: super-admin only (403 for admin non-super), correct roles verified
- User detail: by ID, 400 for invalid UUID, 404 for nonexistent
- User update: phone, role promotion/demotion
- Subscribers: 401/403 guards, admin can list, super-admin can delete
- Subscriber delete: 403 for admin (non-super), 200 for super-admin, 404 after delete

### `blog.test.js`
- Public list: only published, no authentication required
- Admin all: includes unpublished drafts, admin+ only
- Single blog: by UUID, by slug, 404 for unpublished (hidden from public)
- Create: 401/403 guards, auto-slug from title, duplicate slug (400), missing fields (400)
- Update: title, content, publish/unpublish toggles `publishedAt`, duplicate slug (400)
- Delete: 401/403 guards, admin can delete, 404 after deletion
- Featured one-at-a-time: marking B as featured unmarks A

### `marketing.test.js`
- Subscribe: 201 for new, 200 + `alreadySubscribed:true` for duplicate, 400 for missing email
- Contact form: 200 for valid, 400 for missing/short fields (name <2 chars, message <10 chars)
- Waitlist: 200 for valid, also subscribes email, 400 for missing required fields

### `payments.test.js`
- Config: returns `key` starting with `rzp_`, never exposes secret
- Create order: 200 with `order_` prefixed ID, amount in paise, 400 for missing/zero/negative amount
- Verify: invalid HMAC signature → 400, no order created in DB

---

## How Tests Are Isolated

Each test file that creates data cleans up in `afterAll`:

| File | Creates | Cleans Up |
|---|---|---|
| `products.test.js` | 1 test product | Soft-deletes it (`isActive: false`) |
| `orders.test.js` | Multiple orders | Cancels all (also restores stock) |
| `blog.test.js` | Published + draft blog | Deletes both |
| `admin.test.js` | 1 subscriber, 1 temp user | Deletes both |
| `auth.test.js` | Several registered users | Left in DB (unique emails, no side-effects) |
| `marketing.test.js` | Subscribers | Left in DB (synthetic domain, harmless) |

Tests run **sequentially** (one file at a time) to avoid DB race conditions.

---

## What Is NOT Automated

The following flows require a real browser or a live third-party service and are covered in **`MANUAL_TEST_PLAN.md`** instead:

- **Razorpay payment UI** — mock bank page, Success/Failure buttons (T5.2–T5.8)
- **Shiprocket operations** — push order, assign AWB, cancel (T7.2–T7.4) — *production account*
- **Email delivery verification** — open inbox and confirm emails arrived
- **Mobile responsive checks** — must be verified on a real device or DevTools
- **Order tracking progress bar** — visual UI check (T10.1)
- **Cart isolation (T13.2)** — requires switching browser sessions
- **Admin status dropdown modal (T13.3)** — React UI interaction only

---

## Troubleshooting

### `API SERVER IS NOT RUNNING — TESTS ABORTED`
The global setup health check failed. Start the server:
```bash
cd server && npm run dev
```
If your server runs on a different port:
```bash
TEST_API_URL=http://localhost:5000 npm run test:api
```

### `loginAs(...) failed — HTTP 401`
The test personas are not seeded or the passwords have changed. Re-seed:
```bash
npm run seed
```

### `beforeAll: No active product with positive-stock variants found`
The database has no products with stock. Either:
1. Add products via the admin dashboard, or
2. Run the product seed script: `cd server && node scripts/seedProductsAndBlogs.js`

### Tests fail after a partial test run
If a test run was interrupted (e.g. Ctrl+C), some created data may not have been cleaned up.  
Stock may be inconsistent. To fix:
1. Re-run the full test suite — it will clean up in `afterAll`
2. Or manually cancel open test orders in the Admin Dashboard

### `Error: A product with that slug already exists`
A previous test run crashed before cleanup. The test product's slug is still in the DB.  
Either delete the leftover product via Admin Dashboard or DB Studio, then re-run.
```bash
cd server && npm run db:studio
```
