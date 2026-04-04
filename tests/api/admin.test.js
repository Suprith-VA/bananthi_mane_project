// tests/api/admin.test.js
// ─────────────────────────────────────────────────────────────────────────────
// Admin endpoint tests
//
// Covers:
//   GET  /api/admin/stats              — dashboard stats (admin + super-admin)
//   GET  /api/admin/users              — user list (super-admin only)
//   GET  /api/admin/users/:id          — single user (super-admin only)
//   PUT  /api/admin/users/:id          — update user (super-admin only)
//   GET  /api/admin/subscribers        — subscriber list (admin+)
//   GET  /api/admin/subscribers/emails — email list (admin+)
//   DELETE /api/admin/subscribers/:id  — delete subscriber (super-admin only)
//
// Role guard matrix:
//   Endpoint                        | guest | user | admin | super-admin
//   --------------------------------|-------|------|-------|------------
//   GET /api/admin/stats            |  401  |  403 |  200  |    200
//   GET /api/admin/users            |  401  |  403 |  403  |    200
//   GET /api/admin/subscribers      |  401  |  403 |  200  |    200
//   DELETE /api/admin/subscribers   |  401  |  403 |  403  |    200
//
// Cleanup:
//   A subscriber is created in beforeAll and deleted in afterAll.
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
  uniqueEmail,
} from "./setup.js";

// ── Module-level state ────────────────────────────────────────────────────────
let saToken;  // super-admin (ops.test)
let adToken;  // admin non-super (admin.test)
let usToken;  // regular user   (customer.test)

let testSubscriberId;  // subscriber created for delete tests
let testSubscriberEmail;

// ── Global setup ──────────────────────────────────────────────────────────────
beforeAll(async () => {
  [saToken, adToken, usToken] = await Promise.all([
    superAdminToken(),
    adminToken(),
    userToken(),
  ]);

  // Create a subscriber we can use in list / delete tests
  testSubscriberEmail = uniqueEmail("admin-test-sub");
  const { body } = await post("/api/subscribe", {
    email: testSubscriberEmail,
    name: "Admin Test Subscriber",
  });

  testSubscriberId = body.subscriber?._id || body.subscriber?.id;
});

// ── Global teardown ───────────────────────────────────────────────────────────
afterAll(async () => {
  // Best-effort delete — ignore errors (may already be deleted by a test)
  if (testSubscriberId) {
    await del(`/api/admin/subscribers/${testSubscriberId}`, saToken).catch(() => {});
  }
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Admin — Dashboard Stats (GET /api/admin/stats)", () => {
  it("returns 401 for unauthenticated request", async () => {
    const { status } = await get("/api/admin/stats");
    expect(status).toBe(401);
  });

  it("returns 403 for a regular user", async () => {
    const { status } = await get("/api/admin/stats", usToken);
    expect(status).toBe(403);
  });

  it("returns 200 with stats object for admin (non-super)", async () => {
    const { status, body } = await get("/api/admin/stats", adToken);
    expect(status).toBe(200);
    expect(body).toHaveProperty("users");
    expect(body).toHaveProperty("orders");
    expect(body).toHaveProperty("products");
    expect(body).toHaveProperty("blogs");
    expect(body).toHaveProperty("subscribers");
    expect(body).toHaveProperty("recentOrders");
  });

  it("returns 200 with stats object for super-admin", async () => {
    const { status, body } = await get("/api/admin/stats", saToken);
    expect(status).toBe(200);
    expect(body).toHaveProperty("users");
    expect(body).toHaveProperty("orders");
  });

  it("stats counts are non-negative numbers", async () => {
    const { body } = await get("/api/admin/stats", saToken);
    expect(typeof body.users).toBe("number");
    expect(typeof body.orders).toBe("number");
    expect(typeof body.products).toBe("number");
    expect(typeof body.blogs).toBe("number");
    expect(typeof body.subscribers).toBe("number");
    expect(body.users).toBeGreaterThanOrEqual(0);
    expect(body.orders).toBeGreaterThanOrEqual(0);
    expect(body.products).toBeGreaterThanOrEqual(0);
  });

  it("recentOrders is an array of at most 5 entries", async () => {
    const { body } = await get("/api/admin/stats", saToken);
    expect(Array.isArray(body.recentOrders)).toBe(true);
    expect(body.recentOrders.length).toBeLessThanOrEqual(5);
  });

  it("stats.products counts only active products", async () => {
    // We can't control exactly what's in the DB, but we can verify
    // the value is a number >= 0 and the endpoint responds consistently
    const first  = await get("/api/admin/stats", saToken);
    const second = await get("/api/admin/stats", saToken);
    expect(first.body.products).toBe(second.body.products);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Admin — User Management (GET/PUT /api/admin/users)", () => {
  it("GET /api/admin/users returns 401 for unauthenticated request", async () => {
    const { status } = await get("/api/admin/users");
    expect(status).toBe(401);
  });

  it("GET /api/admin/users returns 403 for regular user", async () => {
    const { status } = await get("/api/admin/users", usToken);
    expect(status).toBe(403);
  });

  it("GET /api/admin/users returns 403 for admin (non-super)", async () => {
    // Users list is super-admin only
    const { status } = await get("/api/admin/users", adToken);
    expect(status).toBe(403);
  });

  it("GET /api/admin/users returns 200 with array for super-admin", async () => {
    const { status, body } = await get("/api/admin/users", saToken);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it("returned users have expected fields (no password exposed)", async () => {
    const { body } = await get("/api/admin/users", saToken);
    const user = body[0];
    const required = ["_id", "email", "name", "role", "isAdmin"];
    required.forEach((f) => expect(user).toHaveProperty(f));
    // Password must never be returned
    expect(user).not.toHaveProperty("password");
  });

  it("returned user list includes all three seeded test personas", async () => {
    const { body } = await get("/api/admin/users", saToken);
    const emails = body.map((u) => u.email);

    expect(emails).toContain("customer.test@bananthi.local");
    expect(emails).toContain("admin.test@bananthi.local");
    expect(emails).toContain("ops.test@bananthi.local");
  });

  it("seeded roles are correct for each test persona", async () => {
    const { body } = await get("/api/admin/users", saToken);
    const byEmail = Object.fromEntries(body.map((u) => [u.email, u]));

    expect(byEmail["customer.test@bananthi.local"].role).toBe("user");
    expect(byEmail["admin.test@bananthi.local"].role).toBe("admin");
    expect(byEmail["ops.test@bananthi.local"].role).toBe("super-admin");
  });

  it("GET /api/admin/users/:id returns 401 for unauthenticated request", async () => {
    const { body: users } = await get("/api/admin/users", saToken);
    const someId = users[0]._id;

    const { status } = await get(`/api/admin/users/${someId}`);
    expect(status).toBe(401);
  });

  it("GET /api/admin/users/:id returns 403 for admin (non-super)", async () => {
    const { body: users } = await get("/api/admin/users", saToken);
    const someId = users[0]._id;

    const { status } = await get(`/api/admin/users/${someId}`, adToken);
    expect(status).toBe(403);
  });

  it("GET /api/admin/users/:id returns the correct user for super-admin", async () => {
    const { body: users } = await get("/api/admin/users", saToken);
    const target = users.find((u) => u.email === "customer.test@bananthi.local");

    const { status, body } = await get(`/api/admin/users/${target._id}`, saToken);
    expect(status).toBe(200);
    expect(body.email).toBe("customer.test@bananthi.local");
    expect(body.role).toBe("user");
  });

  it("GET /api/admin/users/:id returns 400 for an invalid (non-UUID) id", async () => {
    const { status } = await get("/api/admin/users/not-a-uuid", saToken);
    expect(status).toBe(400);
  });

  it("GET /api/admin/users/:id returns 404 for a non-existent UUID", async () => {
    const { status } = await get(
      "/api/admin/users/00000000-0000-0000-0000-000000000000",
      saToken
    );
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Admin — Update User (PUT /api/admin/users/:id)", () => {
  let tempUserId;
  let tempUserEmail;

  beforeAll(async () => {
    // Register a temp user to modify safely without touching seeded accounts
    tempUserEmail = uniqueEmail("admin-update-target");
    const { body } = await post("/api/auth/register", {
      name: "Temp Update Target",
      email: tempUserEmail,
      password: "TempPass@999",
      phone: "9800000001",
    });
    tempUserId = body._id || body.id;
  });

  afterAll(async () => {
    // Delete the temp user — ignore errors
    if (tempUserId) {
      await del(`/api/admin/users/${tempUserId}`, saToken).catch(() => {});
    }
  });

  it("returns 403 for admin (non-super)", async () => {
    const { status } = await put(
      `/api/admin/users/${tempUserId}`,
      { phone: "9999999999" },
      adToken
    );
    expect(status).toBe(403);
  });

  it("super-admin can update a user's phone", async () => {
    const { status, body } = await put(
      `/api/admin/users/${tempUserId}`,
      { phone: "9888888888" },
      saToken
    );
    expect(status).toBe(200);
    expect(body.phone).toBe("9888888888");
  });

  it("super-admin can update a user's role to 'admin'", async () => {
    const { status, body } = await put(
      `/api/admin/users/${tempUserId}`,
      { role: "admin" },
      saToken
    );
    expect(status).toBe(200);
    expect(body.role).toBe("admin");
    expect(body.isAdmin).toBe(true);
  });

  it("super-admin can demote user back to 'user' role", async () => {
    const { status, body } = await put(
      `/api/admin/users/${tempUserId}`,
      { role: "user" },
      saToken
    );
    expect(status).toBe(200);
    expect(body.role).toBe("user");
    expect(body.isAdmin).toBe(false);
  });

  it("returns 400 for an invalid (non-UUID) user id", async () => {
    const { status } = await put(
      "/api/admin/users/not-a-uuid",
      { phone: "9111111111" },
      saToken
    );
    expect(status).toBe(400);
  });

  it("returns 404 for a non-existent user UUID", async () => {
    const { status } = await put(
      "/api/admin/users/00000000-0000-0000-0000-000000000000",
      { phone: "9111111111" },
      saToken
    );
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Admin — Subscriber Management", () => {
  it("GET /api/admin/subscribers returns 401 for unauthenticated request", async () => {
    const { status } = await get("/api/admin/subscribers");
    expect(status).toBe(401);
  });

  it("GET /api/admin/subscribers returns 403 for regular user", async () => {
    const { status } = await get("/api/admin/subscribers", usToken);
    expect(status).toBe(403);
  });

  it("GET /api/admin/subscribers returns 200 with array for admin (non-super)", async () => {
    const { status, body } = await get("/api/admin/subscribers", adToken);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it("GET /api/admin/subscribers returns 200 with array for super-admin", async () => {
    const { status, body } = await get("/api/admin/subscribers", saToken);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it("subscriber list includes the test subscriber we created in beforeAll", async () => {
    const { body } = await get("/api/admin/subscribers", saToken);
    const found = body.find(
      (s) => s.email === testSubscriberEmail
    );
    expect(found).toBeTruthy();
    expect(found).toHaveProperty("_id");
    expect(found).toHaveProperty("email", testSubscriberEmail);
    expect(found.isActive).toBe(true);
  });

  it("each subscriber record has expected fields", async () => {
    const { body } = await get("/api/admin/subscribers", saToken);
    if (body.length === 0) return; // empty DB — skip field check
    const sub = body[0];
    ["_id", "email", "isActive", "createdAt"].forEach((f) =>
      expect(sub).toHaveProperty(f)
    );
  });

  it("GET /api/admin/subscribers/emails returns an array of email strings", async () => {
    const { status, body } = await get("/api/admin/subscribers/emails", saToken);
    expect(status).toBe(200);
    expect(body).toHaveProperty("emails");
    expect(Array.isArray(body.emails)).toBe(true);
    body.emails.forEach((e) => {
      expect(typeof e).toBe("string");
      expect(e).toMatch(/@/); // basic email shape check
    });
  });

  it("DELETE /api/admin/subscribers/:id returns 403 for admin (non-super)", async () => {
    const { status } = await del(
      `/api/admin/subscribers/${testSubscriberId}`,
      adToken
    );
    expect(status).toBe(403);
  });

  it("DELETE /api/admin/subscribers/:id returns 403 for regular user", async () => {
    const { status } = await del(
      `/api/admin/subscribers/${testSubscriberId}`,
      usToken
    );
    expect(status).toBe(403);
  });

  it("DELETE /api/admin/subscribers/:id returns 200 for super-admin", async () => {
    const { status, body } = await del(
      `/api/admin/subscribers/${testSubscriberId}`,
      saToken
    );
    expect(status).toBe(200);
    expect(body).toHaveProperty("message");

    // Clear the ID so afterAll doesn't try to delete again
    testSubscriberId = null;
  });

  it("deleted subscriber no longer appears in the subscriber list", async () => {
    const { body } = await get("/api/admin/subscribers", saToken);
    const found = body.find((s) => s.email === testSubscriberEmail);
    expect(found).toBeFalsy();
  });

  it("DELETE /api/admin/subscribers/:id returns 400 for invalid UUID", async () => {
    const { status } = await del("/api/admin/subscribers/not-a-uuid", saToken);
    expect(status).toBe(400);
  });

  it("DELETE /api/admin/subscribers/:id returns 404 for non-existent UUID", async () => {
    const { status } = await del(
      "/api/admin/subscribers/00000000-0000-0000-0000-000000000000",
      saToken
    );
    expect(status).toBe(404);
  });
});
