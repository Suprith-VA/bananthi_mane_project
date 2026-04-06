// tests/api/orders.test.js
// ─────────────────────────────────────────────────────────────────────────────
// Order endpoint tests
//
// Covers:
//   POST /api/orders                  — create (guest + user)
//   GET  /api/orders/track/:orderId   — track by email/phone
//   GET  /api/orders                  — admin list
//   GET  /api/orders/mine             — user's own orders
//   PUT  /api/orders/:id/status       — fulfillment status (admin)
//   PUT  /api/orders/:id/payment      — payment update (super-admin only)
//   DELETE /api/orders/:id            — cancel + stock restore (super-admin)
//
// Stock sync tests (T3.2 → T3.3 → T3.4):
//   1. Note initial variant stock
//   2. Create order → stock decrements
//   3. Cancel order → stock restores
//   4. Reactivate order → stock re-deducts
//   5. afterAll cleanup → cancel order again
//
// Cleanup strategy:
//   Every order created in this file is cancelled in afterAll via
//   DELETE /api/orders/:id (super-admin).  This also restores all stock.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  get,
  post,
  put,
  del,
  superAdminToken,
  adminToken,
  userToken,
  loginAs,
  uniqueEmail,
  buildCodOrder,
  CREDENTIALS,
  BASE_URL,
} from "./setup.js";

// ── Module-level state ────────────────────────────────────────────────────────
let saToken;
let adToken;
let usToken;

// First available product with variants — resolved in beforeAll
let testProductId;
let testVariantLabel;
let testVariantPrice;

// Orders created during tests — cleaned up in afterAll
const createdOrderIds = [];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Cancel an order by ID using the super-admin DELETE endpoint */
async function cancelOrder(id) {
  if (!id) return;
  await del(`/api/orders/${id}`, saToken);
}

/** Fetch a single product and return the first variant */
async function getFirstVariant(productId) {
  const { body } = await get(`/api/products/${productId}`);
  return body.variants?.[0] ?? null;
}

/** Get current stock for a specific variant label on a product */
async function getVariantStock(productId, unitLabel) {
  const { body } = await get(`/api/products/${productId}`);
  const variant = body.variants?.find((v) => v.unitLabel === unitLabel);
  return variant ? variant.stockQuantity : null;
}

/** Get current product-level stock */
async function getProductStock(productId) {
  const { body } = await get(`/api/products/${productId}`);
  return body.stockQuantity ?? null;
}

// ── Global setup ──────────────────────────────────────────────────────────────
beforeAll(async () => {
  [saToken, adToken, usToken] = await Promise.all([
    superAdminToken(),
    adminToken(),
    userToken(),
  ]);

  // Pick the first active product that has at least one variant with stock > 0
  const { body: products } = await get("/api/products");
  const suitable = products.find(
    (p) =>
      Array.isArray(p.variants) && p.variants.some((v) => v.stockQuantity > 0),
  );

  if (!suitable) {
    throw new Error(
      "beforeAll (orders): No active product with positive-stock variants found. " +
        "Re-seed the database or restore variant stocks before running tests.",
    );
  }

  testProductId = suitable._id;
  const variant = suitable.variants.find((v) => v.stockQuantity > 0);
  testVariantLabel = variant.unitLabel;
  testVariantPrice = variant.price;
});

// ── Global teardown ───────────────────────────────────────────────────────────
afterAll(async () => {
  // Cancel every order we created — this also restores stock
  await Promise.all(createdOrderIds.map(cancelOrder));
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Orders — Guest COD Creation (POST /api/orders)", () => {
  it("creates a COD order as a guest and returns 201 with an order ID", async () => {
    const guestEmail = uniqueEmail("guest-cod");
    const payload = buildCodOrder(
      testProductId,
      testVariantLabel,
      testVariantPrice,
      {
        guestEmail,
        guestName: "Guest Tester",
        guestPhone: "9000000010",
      },
    );

    const { status, body } = await post("/api/orders", payload);
    expect(status).toBe(201);
    expect(body).toHaveProperty("_id");
    expect(body._id).toBeTruthy();
    expect(body.guestEmail).toBe(guestEmail);
    expect(body.fulfillmentStatus).toBe("Processing");
    expect(body.paymentInfo?.paymentMethod ?? body.paymentMethod).toMatch(
      /COD/i,
    );
    expect(body.paymentInfo?.paymentStatus ?? body.paymentStatus).toMatch(
      /Pending/i,
    );
    expect(body.isPaid).toBe(false);
    expect(Array.isArray(body.items) || Array.isArray(body.orderItems)).toBe(
      true,
    );

    createdOrderIds.push(body._id);
  });

  it("order items contain the correct product, variant, price, and quantity", async () => {
    const guestEmail = uniqueEmail("guest-items");
    const payload = buildCodOrder(
      testProductId,
      testVariantLabel,
      testVariantPrice,
      {
        guestEmail,
      },
    );

    const { status, body } = await post("/api/orders", payload);
    expect(status).toBe(201);

    const items = body.items ?? body.orderItems ?? [];
    expect(items.length).toBe(1);
    expect(items[0].product ?? items[0].productId).toBe(testProductId);
    expect(items[0].unitLabel).toBe(testVariantLabel);
    expect(items[0].price).toBe(testVariantPrice);
    expect(items[0].qty ?? items[0].quantity).toBe(1);

    createdOrderIds.push(body._id);
  });

  it("returns 400 when guest fields (email, phone, name) are missing", async () => {
    const payload = {
      items: [
        {
          product: testProductId,
          name: "Test Product",
          unitLabel: testVariantLabel,
          price: testVariantPrice,
          quantity: 1,
        },
      ],
      totalPrice: testVariantPrice,
      shippingAddress: "123 Test St, Bengaluru",
      // deliberately omitting guestEmail, guestPhone, guestName
    };

    const { status, body } = await post("/api/orders", payload);
    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
    expect(body.message).toMatch(/guest details/i);
  });

  it("returns 400 when items array is empty", async () => {
    const { status, body } = await post("/api/orders", {
      items: [],
      totalPrice: 0,
      shippingAddress: "123 Test St",
      guestName: "Ghost",
      guestEmail: uniqueEmail("empty"),
      guestPhone: "9000000011",
    });
    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Orders — Logged-in User COD Creation", () => {
  it("creates a COD order as a logged-in user (no guest fields required)", async () => {
    const payload = {
      items: [
        {
          product: testProductId,
          name: "Test Product",
          unitLabel: testVariantLabel,
          price: testVariantPrice,
          quantity: 1,
          image: "/images/test.png",
        },
      ],
      totalPrice: testVariantPrice,
      shippingAddress: "99 User Lane, Bengaluru, Karnataka, 560001",
      // No guestEmail / guestPhone / guestName — server should use the logged-in user
    };

    const { status, body } = await post("/api/orders", payload, usToken);
    expect(status).toBe(201);
    expect(body).toHaveProperty("_id");

    // For a logged-in user, the user field should be populated
    const user = body.user;
    expect(user).toBeTruthy();
    if (typeof user === "object") {
      expect(user.email).toBe(CREDENTIALS.user.email);
    }

    createdOrderIds.push(body._id);
  });

  it("order appears in GET /api/orders/mine for the logged-in user", async () => {
    // Create a fresh order for this user
    const payload = {
      items: [
        {
          product: testProductId,
          name: "Mine Test Product",
          unitLabel: testVariantLabel,
          price: testVariantPrice,
          quantity: 1,
        },
      ],
      totalPrice: testVariantPrice,
      shippingAddress: "Mine Lane, Bengaluru",
    };

    const { body: created } = await post("/api/orders", payload, usToken);
    const newOrderId = created._id;
    createdOrderIds.push(newOrderId);

    // Fetch the user's order list
    const { status, body: myOrders } = await get("/api/orders/mine", usToken);
    expect(status).toBe(200);
    expect(Array.isArray(myOrders)).toBe(true);

    const found = myOrders.find((o) => o._id === newOrderId);
    expect(found).toBeTruthy();
  });

  it("GET /api/orders/mine returns 401 for unauthenticated request", async () => {
    const { status } = await get("/api/orders/mine");
    expect(status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Orders — Tracking (GET /api/orders/track/:orderId)", () => {
  let trackOrderId;
  let trackEmail;

  beforeAll(async () => {
    // Create a dedicated guest order for tracking tests
    trackEmail = uniqueEmail("track");
    const payload = buildCodOrder(
      testProductId,
      testVariantLabel,
      testVariantPrice,
      {
        guestEmail: trackEmail,
        guestName: "Track Tester",
        guestPhone: "9100000001",
      },
    );

    const { body } = await post("/api/orders", payload);
    trackOrderId = body._id;
    createdOrderIds.push(trackOrderId);
  });

  it("returns order details when correct email is provided", async () => {
    const { status, body } = await get(
      `/api/orders/track/${trackOrderId}?email=${encodeURIComponent(trackEmail)}`,
    );

    expect(status).toBe(200);
    expect(body).toHaveProperty("_id", trackOrderId);
    expect(body).toHaveProperty("fulfillmentStatus");
    expect(body).toHaveProperty("totalPrice");
  });

  it("returns 403 when the email does not match the order", async () => {
    const { status, body } = await get(
      `/api/orders/track/${trackOrderId}?email=wrong.email@test.com`,
    );

    expect(status).toBe(403);
    expect(body.message).toMatch(/do not match/i);
  });

  it("returns 400 when neither email nor phone is provided", async () => {
    const { status } = await get(`/api/orders/track/${trackOrderId}`);
    expect(status).toBe(400);
  });

  it("returns 400 for an invalid (non-UUID) order ID", async () => {
    const { status } = await get(
      `/api/orders/track/not-a-uuid?email=${encodeURIComponent(trackEmail)}`,
    );
    expect(status).toBe(400);
  });

  it("returns 404 for a well-formed UUID that does not exist", async () => {
    const { status } = await get(
      `/api/orders/track/00000000-0000-0000-0000-000000000000?email=anyone@test.com`,
    );
    expect(status).toBe(404);
  });

  it("tracking works with phone number instead of email", async () => {
    const { status, body } = await get(
      `/api/orders/track/${trackOrderId}?phone=9100000001`,
    );
    expect(status).toBe(200);
    expect(body._id).toBe(trackOrderId);
  });

  it("tracking response includes awbCode and courierName fields (null when not shipped)", async () => {
    const { body } = await get(
      `/api/orders/track/${trackOrderId}?email=${encodeURIComponent(trackEmail)}`,
    );
    // Fields should be present in response; null when no Shiprocket data yet
    expect(body).toHaveProperty("awbCode");
    expect(body).toHaveProperty("courierName");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Orders — Admin Order List (GET /api/orders)", () => {
  it("returns 401 for unauthenticated request", async () => {
    const { status } = await get("/api/orders");
    expect(status).toBe(401);
  });

  it("returns 403 for a regular user", async () => {
    const { status } = await get("/api/orders", usToken);
    expect(status).toBe(403);
  });

  it("returns 200 with an array for admin (non-super)", async () => {
    const { status, body } = await get("/api/orders", adToken);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it("returns 200 with an array for super-admin", async () => {
    const { status, body } = await get("/api/orders", saToken);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it("each order in the list has expected fields", async () => {
    const { body } = await get("/api/orders", saToken);
    const order = body[0];
    const requiredFields = [
      "_id",
      "totalPrice",
      "fulfillmentStatus",
      "paymentInfo",
      "createdAt",
    ];
    requiredFields.forEach((f) => expect(order).toHaveProperty(f));
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Orders — Status Update (PUT /api/orders/:id/status)", () => {
  let statusOrderId;

  beforeAll(async () => {
    // Create a dedicated order for status-update tests
    const payload = buildCodOrder(
      testProductId,
      testVariantLabel,
      testVariantPrice,
      {
        guestEmail: uniqueEmail("status"),
        guestName: "Status Tester",
        guestPhone: "9200000001",
      },
    );
    const { body } = await post("/api/orders", payload);
    statusOrderId = body._id;
    createdOrderIds.push(statusOrderId);
  });

  it("returns 401 when not authenticated", async () => {
    const { status } = await put(`/api/orders/${statusOrderId}/status`, {
      fulfillmentStatus: "Packed",
    });
    expect(status).toBe(401);
  });

  it("returns 403 for a regular user", async () => {
    const { status } = await put(
      `/api/orders/${statusOrderId}/status`,
      { fulfillmentStatus: "Packed" },
      usToken,
    );
    expect(status).toBe(403);
  });

  it("admin can update fulfillmentStatus to 'Packed'", async () => {
    const { status, body } = await put(
      `/api/orders/${statusOrderId}/status`,
      { fulfillmentStatus: "Packed" },
      adToken,
    );
    expect(status).toBe(200);
    expect(body.fulfillmentStatus).toBe("Packed");
  });

  it("admin can update fulfillmentStatus to 'Shipped'", async () => {
    const { status, body } = await put(
      `/api/orders/${statusOrderId}/status`,
      { fulfillmentStatus: "Shipped" },
      adToken,
    );
    expect(status).toBe(200);
    expect(body.fulfillmentStatus).toBe("Shipped");
  });

  it("returns 404 for a non-existent order ID", async () => {
    const { status } = await put(
      "/api/orders/00000000-0000-0000-0000-000000000000/status",
      { fulfillmentStatus: "Packed" },
      adToken,
    );
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Orders — Payment Update (PUT /api/orders/:id/payment)", () => {
  let paymentOrderId;

  beforeAll(async () => {
    const payload = buildCodOrder(
      testProductId,
      testVariantLabel,
      testVariantPrice,
      {
        guestEmail: uniqueEmail("payment"),
        guestName: "Payment Tester",
        guestPhone: "9300000001",
      },
    );
    const { body } = await post("/api/orders", payload);
    paymentOrderId = body._id;
    createdOrderIds.push(paymentOrderId);
  });

  it("admin (non-super) can update payment status", async () => {
    const { status } = await put(
      `/api/orders/${paymentOrderId}/payment`,
      { paymentStatus: "Paid", isPaid: true },
      adToken,
    );
    expect(status).toBe(200);
  });

  it("super-admin can mark order as Paid", async () => {
    const { status, body } = await put(
      `/api/orders/${paymentOrderId}/payment`,
      { paymentStatus: "Paid", isPaid: true },
      saToken,
    );
    expect(status).toBe(200);
    expect(body.paymentInfo?.paymentStatus ?? body.paymentStatus).toBe("Paid");
    expect(body.isPaid).toBe(true);
  });

  it("super-admin can update paymentMethod", async () => {
    const { status, body } = await put(
      `/api/orders/${paymentOrderId}/payment`,
      { paymentMethod: "Razorpay" },
      saToken,
    );
    expect(status).toBe(200);
    expect(body.paymentInfo?.paymentMethod ?? body.paymentMethod).toBe(
      "Razorpay",
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Orders — Stock Synchronization (T3.2 → T3.3 → T3.4)", () => {
  let stockOrderId;
  let initialVariantStock;
  let initialProductStock;

  beforeAll(async () => {
    // Previous describe blocks place orders against testVariantLabel without
    // cancelling them until the global afterAll.  Reset the variant to a known
    // stock level (50) so this describe block starts from a predictable state.
    const { body: freshProd } = await get(`/api/products/${testProductId}`);
    const resetVariants = freshProd.variants.map((v) =>
      v.unitLabel === testVariantLabel ? { ...v, stockQuantity: 50 } : v,
    );
    await put(
      `/api/products/${testProductId}`,
      { variants: resetVariants },
      saToken,
    );

    // Record stock AFTER the reset
    initialVariantStock = await getVariantStock(
      testProductId,
      testVariantLabel,
    );
    initialProductStock = await getProductStock(testProductId);

    if (initialVariantStock === null || initialVariantStock < 1) {
      throw new Error(
        `Stock test setup failed: variant "${testVariantLabel}" has stock ` +
          `${initialVariantStock} even after reset — check the DB.`,
      );
    }
  });

  afterAll(async () => {
    // Belt-and-braces: cancel the order if it wasn't already cancelled inside the tests
    if (stockOrderId) {
      await cancelOrder(stockOrderId);
      // Remove from the main cleanup list to avoid double-cancel
      const idx = createdOrderIds.indexOf(stockOrderId);
      if (idx !== -1) createdOrderIds.splice(idx, 1);
    }
  });

  it("T3.2 — variant stock decrements by 1 after order creation", async () => {
    const payload = buildCodOrder(
      testProductId,
      testVariantLabel,
      testVariantPrice,
      {
        guestEmail: uniqueEmail("stock"),
        guestName: "Stock Tester",
        guestPhone: "9400000001",
      },
    );

    const { status, body } = await post("/api/orders", payload);
    expect(status).toBe(201);
    stockOrderId = body._id;

    const afterVariantStock = await getVariantStock(
      testProductId,
      testVariantLabel,
    );
    const afterProductStock = await getProductStock(testProductId);

    expect(afterVariantStock).toBe(initialVariantStock - 1);
    expect(afterProductStock).toBe(initialProductStock - 1);
  });

  it("T3.3 — variant stock restores by 1 when order is cancelled", async () => {
    // Cancelling via fulfillmentStatus update to 'Cancelled'
    const { status } = await put(
      `/api/orders/${stockOrderId}/status`,
      { fulfillmentStatus: "Cancelled" },
      adToken,
    );
    expect(status).toBe(200);

    const afterCancelVariantStock = await getVariantStock(
      testProductId,
      testVariantLabel,
    );
    const afterCancelProductStock = await getProductStock(testProductId);

    expect(afterCancelVariantStock).toBe(initialVariantStock);
    expect(afterCancelProductStock).toBe(initialProductStock);
  });

  it("T3.4 — variant stock re-deducts by 1 when cancelled order is reactivated", async () => {
    // Reactivating via fulfillmentStatus back to 'Processing'
    const { status } = await put(
      `/api/orders/${stockOrderId}/status`,
      { fulfillmentStatus: "Processing" },
      adToken,
    );
    expect(status).toBe(200);

    const afterReactivateVariantStock = await getVariantStock(
      testProductId,
      testVariantLabel,
    );
    const afterReactivateProductStock = await getProductStock(testProductId);

    expect(afterReactivateVariantStock).toBe(initialVariantStock - 1);
    expect(afterReactivateProductStock).toBe(initialProductStock - 1);
  });

  it("product-level stockQuantity always equals sum of variant stocks", async () => {
    const { body } = await get(`/api/products/${testProductId}`);
    const variantSum = body.variants.reduce(
      (s, v) => s + (v.stockQuantity ?? 0),
      0,
    );
    expect(body.stockQuantity).toBe(variantSum);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Orders — Out-of-Stock Guard (T3.5)", () => {
  it("returns 400 when variant stock is 0 — API-level guard", async () => {
    // Step 1: fetch current product state
    const { body: prod } = await get(`/api/products/${testProductId}`);

    // Step 2: set only that variant's stock to 0 and push the update
    const zeroVariants = prod.variants.map((v) =>
      v.unitLabel === testVariantLabel ? { ...v, stockQuantity: 0 } : v,
    );

    const { status: updateStatus } = await put(
      `/api/products/${testProductId}`,
      { variants: zeroVariants },
      saToken,
    );
    expect(updateStatus).toBe(200);

    // Step 3: re-fetch the product to obtain the NEW variant ID.
    // The PUT handler deletes + recreates all variants, so IDs change after
    // every update — using the pre-update ID would give a "not found" and the
    // stock check would be silently skipped.
    const { body: updatedProd } = await get(`/api/products/${testProductId}`);
    const updatedVariant = updatedProd.variants.find(
      (v) => v.unitLabel === testVariantLabel,
    );
    expect(updatedVariant).toBeTruthy();
    expect(updatedVariant.stockQuantity).toBe(0);

    // Step 4: place an order that includes the fresh variantId so the server
    // uses the variant-level stock check (not the product-level total).
    const payload = {
      items: [
        {
          product: testProductId,
          variantId: updatedVariant._id || updatedVariant.id,
          name: "Test Product",
          unitLabel: testVariantLabel,
          price: testVariantPrice,
          quantity: 1,
          image: "/images/test.png",
        },
      ],
      totalPrice: testVariantPrice,
      shippingAddress: "42 OOS Street, Bengaluru, Karnataka, 560001",
      guestName: "OOS Tester",
      guestEmail: uniqueEmail("oos"),
      guestPhone: "9500000001",
    };

    const { status, body } = await post("/api/orders", payload);
    expect(status).toBe(400);
    expect(body.message).toMatch(/insufficient stock/i);

    // Step 5: restore to a known good stock (50) so subsequent tests are unaffected
    const restoredVariants = prod.variants.map((v) =>
      v.unitLabel === testVariantLabel ? { ...v, stockQuantity: 50 } : v,
    );
    await put(
      `/api/products/${testProductId}`,
      { variants: restoredVariants },
      saToken,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Orders — Cancel (DELETE /api/orders/:id) + stock restore", () => {
  let cancelOrderId;
  let stockBefore;

  it("super-admin can cancel an order and stock is restored", async () => {
    stockBefore = await getVariantStock(testProductId, testVariantLabel);

    // Create order
    const payload = buildCodOrder(
      testProductId,
      testVariantLabel,
      testVariantPrice,
      {
        guestEmail: uniqueEmail("cancel"),
        guestName: "Cancel Tester",
        guestPhone: "9600000001",
      },
    );
    const { body: created } = await post("/api/orders", payload);
    cancelOrderId = created._id;

    const stockAfterCreate = await getVariantStock(
      testProductId,
      testVariantLabel,
    );
    expect(stockAfterCreate).toBe(stockBefore - 1);

    // Cancel via DELETE
    const { status, body } = await del(`/api/orders/${cancelOrderId}`, saToken);
    expect(status).toBe(200);
    expect(body.message).toMatch(/cancelled/i);

    const stockAfterCancel = await getVariantStock(
      testProductId,
      testVariantLabel,
    );
    expect(stockAfterCancel).toBe(stockBefore);
  });

  it("returns 400 when attempting to cancel an already-cancelled order", async () => {
    // cancelOrderId was already cancelled above
    const { status, body } = await del(`/api/orders/${cancelOrderId}`, saToken);
    expect(status).toBe(400);
    expect(body.message).toMatch(/already cancelled/i);
  });

  it("admin (non-super) can cancel an order via DELETE", async () => {
    const payload = buildCodOrder(
      testProductId,
      testVariantLabel,
      testVariantPrice,
      {
        guestEmail: uniqueEmail("cancel-admin"),
        guestName: "Cancel Admin Tester",
        guestPhone: "9600000002",
      },
    );
    const { body: created } = await post("/api/orders", payload);
    const tempId = created._id;
    createdOrderIds.push(tempId);

    const { status, body } = await del(`/api/orders/${tempId}`, adToken);
    expect(status).toBe(200);
    expect(body.message).toMatch(/cancelled/i);
  });

  it("returns 401 for unauthenticated DELETE attempt", async () => {
    const { status } = await del(
      "/api/orders/00000000-0000-0000-0000-000000000000",
    );
    expect(status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Orders — Multi-item order (T11.1)", () => {
  it("creates an order with 2 line items and correct total", async () => {
    const { body: products } = await get("/api/products");
    // Pick the first two products that have stock
    const eligible = products.filter((p) =>
      p.variants?.some((v) => v.stockQuantity > 0),
    );

    if (eligible.length < 2) {
      // Not enough products — skip gracefully
      return;
    }

    const p1 = eligible[0];
    const v1 = p1.variants.find((v) => v.stockQuantity > 0);
    const p2 = eligible[1];
    const v2 = p2.variants.find((v) => v.stockQuantity > 0);

    const total = v1.price + v2.price;

    const { status, body } = await post("/api/orders", {
      items: [
        {
          product: p1._id,
          name: p1.name,
          unitLabel: v1.unitLabel,
          price: v1.price,
          quantity: 1,
          image: p1.image,
        },
        {
          product: p2._id,
          name: p2.name,
          unitLabel: v2.unitLabel,
          price: v2.price,
          quantity: 1,
          image: p2.image,
        },
      ],
      totalPrice: total,
      shippingAddress: "Multi Item Lane, Bengaluru, 560001",
      guestName: "Multi Tester",
      guestEmail: uniqueEmail("multi"),
      guestPhone: "9700000001",
    });

    expect(status).toBe(201);
    const items = body.items ?? body.orderItems ?? [];
    expect(items.length).toBe(2);
    expect(body.totalPrice).toBe(total);

    createdOrderIds.push(body._id);
  });
});
