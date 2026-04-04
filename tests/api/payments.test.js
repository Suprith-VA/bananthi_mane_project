// tests/api/payments.test.js
// ─────────────────────────────────────────────────────────────────────────────
// Payment endpoint tests
//
// Covers:
//   GET  /api/payments/config        — returns Razorpay key_id (never secret)
//   POST /api/payments/create-order  — creates a Razorpay order (amount in paise)
//   POST /api/payments/verify        — rejects invalid HMAC signature
//
// Note:
//   The actual Razorpay payment popup + card-entry UI flow cannot be automated
//   via API tests — it requires a real browser. Those flows are covered in
//   tests/MANUAL_TEST_PLAN.md (T5.2 – T5.8).
//
//   POST /api/payments/verify with a VALID signature is also not automatable
//   here because generating a valid HMAC requires the live Razorpay key_secret,
//   which is intentionally not exposed in tests.  The full happy-path is
//   exercised manually (T5.2) and via the running application.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeAll } from "vitest";
import { get, post, superAdminToken, userToken } from "./setup.js";

// ── Module-level state ────────────────────────────────────────────────────────
let saToken;
let usToken;

// ── Global setup ──────────────────────────────────────────────────────────────
beforeAll(async () => {
  [saToken, usToken] = await Promise.all([superAdminToken(), userToken()]);
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Payments — Config (GET /api/payments/config)", () => {
  it("returns 200 with a key field", async () => {
    const { status, body } = await get("/api/payments/config");
    expect(status).toBe(200);
    expect(body).toHaveProperty("key");
  });

  it("returned key is a non-empty string", async () => {
    const { body } = await get("/api/payments/config");
    expect(typeof body.key).toBe("string");
    expect(body.key.length).toBeGreaterThan(0);
  });

  it("returned key starts with 'rzp_' (Razorpay key format)", async () => {
    const { body } = await get("/api/payments/config");
    expect(body.key).toMatch(/^rzp_/);
  });

  it("does NOT expose key_secret or any secret field", async () => {
    const { body } = await get("/api/payments/config");
    // None of these fields must be present in the response
    expect(body).not.toHaveProperty("secret");
    expect(body).not.toHaveProperty("key_secret");
    expect(body).not.toHaveProperty("keySecret");
    expect(body).not.toHaveProperty("RAZORPAY_KEY_SECRET");
  });

  it("does not require authentication (publicly accessible)", async () => {
    // Called with no token — must still return 200
    const { status } = await get("/api/payments/config");
    expect(status).toBe(200);
  });

  it("returns consistent key across multiple calls", async () => {
    const first = await get("/api/payments/config");
    const second = await get("/api/payments/config");
    expect(first.body.key).toBe(second.body.key);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Payments — Create Razorpay Order (POST /api/payments/create-order)", () => {
  it("returns 200 with a valid Razorpay order object for amount=450", async () => {
    const { status, body } = await post("/api/payments/create-order", {
      amount: 450,
    });

    expect(status).toBe(200);
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("amount");
    expect(body).toHaveProperty("currency");
  });

  it("order id starts with 'order_'", async () => {
    const { body } = await post("/api/payments/create-order", { amount: 250 });
    expect(typeof body.id).toBe("string");
    expect(body.id).toMatch(/^order_/);
  });

  it("amount is converted to paise (multiplied by 100)", async () => {
    const { body } = await post("/api/payments/create-order", { amount: 450 });
    // 450 rupees × 100 = 45000 paise
    expect(body.amount).toBe(45000);
  });

  it("currency is 'INR'", async () => {
    const { body } = await post("/api/payments/create-order", { amount: 100 });
    expect(body.currency).toBe("INR");
  });

  it("works with a fractional amount (rounds to nearest paise)", async () => {
    const { status, body } = await post("/api/payments/create-order", {
      amount: 99.5,
    });
    expect(status).toBe(200);
    // 99.5 × 100 = 9950, Math.round → 9950
    expect(body.amount).toBe(9950);
  });

  it("works with a logged-in user token (optionalProtect route)", async () => {
    const { status, body } = await post(
      "/api/payments/create-order",
      { amount: 300 },
      usToken,
    );
    expect(status).toBe(200);
    expect(body).toHaveProperty("id");
  });

  it("works without any auth token (guest checkout)", async () => {
    const { status, body } = await post("/api/payments/create-order", {
      amount: 300,
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty("id");
  });

  it("returns 400 when amount is missing", async () => {
    const { status, body } = await post("/api/payments/create-order", {});
    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
    expect(body.message).toMatch(/amount/i);
  });

  it("returns 400 when amount is 0", async () => {
    const { status, body } = await post("/api/payments/create-order", {
      amount: 0,
    });
    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
  });

  it("returns 400 when amount is negative", async () => {
    const { status, body } = await post("/api/payments/create-order", {
      amount: -100,
    });
    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
  });

  it("rejects a non-numeric string amount (4xx or 5xx — never 2xx)", async () => {
    // "not-a-number" * 100 = NaN which the Razorpay SDK rejects — the server
    // may return 400 (our guard) or 500 (SDK error). Either is acceptable;
    // the important thing is that no order/Razorpay order is created.
    const { status, body } = await post("/api/payments/create-order", {
      amount: "not-a-number",
    });
    expect(status).toBeGreaterThanOrEqual(400);
    expect(body).toHaveProperty("message");
  });

  it("each call generates a unique Razorpay order id", async () => {
    const [res1, res2] = await Promise.all([
      post("/api/payments/create-order", { amount: 150 }),
      post("/api/payments/create-order", { amount: 150 }),
    ]);
    expect(res1.body.id).toBeTruthy();
    expect(res2.body.id).toBeTruthy();
    expect(res1.body.id).not.toBe(res2.body.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Payments — Verify Signature (POST /api/payments/verify)", () => {
  /**
   * Helper: build a verify payload with an intentionally wrong signature.
   * The server should reject it with HTTP 400.
   */
  function badSignaturePayload(overrides = {}) {
    return {
      razorpay_order_id: "order_fake000000000001",
      razorpay_payment_id: "pay_fake000000000001",
      razorpay_signature: "thisisnotavalidsignatureatall",
      orderData: {
        items: [
          {
            product: "00000000-0000-0000-0000-000000000001",
            name: "Test Product",
            unitLabel: "100g",
            price: 100,
            quantity: 1,
            image: "/images/test.png",
          },
        ],
        totalPrice: 100,
        shippingAddress: "42 Test Lane, Bengaluru, Karnataka, 560001",
        guestName: "Verify Tester",
        guestEmail: "verify.tester@autotest.bananthi.local",
        guestPhone: "9000000099",
      },
      ...overrides,
    };
  }

  it("returns 400 with 'invalid signature' message for a bad signature", async () => {
    const { status, body } = await post(
      "/api/payments/verify",
      badSignaturePayload(),
    );

    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
    expect(body.message).toMatch(/invalid signature/i);
  });

  it("does NOT create an order when signature is invalid", async () => {
    // Submit with a unique guest email so we can search for it later
    const uniqueGuestEmail = `no-order-${Date.now()}@autotest.bananthi.local`;

    const { status } = await post(
      "/api/payments/verify",
      badSignaturePayload({
        orderData: {
          items: [
            {
              product: "00000000-0000-0000-0000-000000000002",
              name: "Ghost Product",
              unitLabel: "50g",
              price: 50,
              quantity: 1,
            },
          ],
          totalPrice: 50,
          shippingAddress: "Ghost Lane",
          guestName: "Ghost User",
          guestEmail: uniqueGuestEmail,
          guestPhone: "9000000011",
        },
      }),
    );

    expect(status).toBe(400);

    // Verify no order was created for this email
    const { body: orders } = await get("/api/orders", saToken);
    const ghostOrder = orders.find((o) => o.guestEmail === uniqueGuestEmail);
    expect(ghostOrder).toBeFalsy();
  });

  it("returns 400 with a completely wrong signature format", async () => {
    const { status, body } = await post(
      "/api/payments/verify",
      badSignaturePayload({ razorpay_signature: "abc" }),
    );

    expect(status).toBe(400);
    expect(body.message).toMatch(/invalid signature/i);
  });

  it("returns 400 when razorpay_signature is an empty string", async () => {
    const { status, body } = await post(
      "/api/payments/verify",
      badSignaturePayload({ razorpay_signature: "" }),
    );

    // Either 400 (explicit rejection) or 500 (crypto fails on empty input)
    // Either way it must NOT be a 2xx success
    expect(status).toBeGreaterThanOrEqual(400);
    expect(body).toHaveProperty("message");
  });

  it("returns 400 when razorpay_order_id is a completely fake value", async () => {
    const { status } = await post(
      "/api/payments/verify",
      badSignaturePayload({ razorpay_order_id: "NOT_REAL" }),
    );

    expect(status).toBe(400);
  });

  it("works without an auth token (optionalProtect route — guest checkout)", async () => {
    // Same bad signature, but called with no token — must still return 400 (not 401)
    const { status } = await post(
      "/api/payments/verify",
      badSignaturePayload(),
    );

    expect(status).toBe(400);
  });

  it("works with a logged-in user token and still rejects bad signature", async () => {
    const { status } = await post(
      "/api/payments/verify",
      badSignaturePayload(),
      usToken,
    );

    expect(status).toBe(400);
  });
});
