// tests/api/auth.test.js
// ─────────────────────────────────────────────────────────────────────────────
// Auth endpoint tests — register, login, forgot-password
// All tests are self-contained: new users use unique timestamped emails.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeAll } from "vitest";
import { post, CREDENTIALS, uniqueEmail, loginAs } from "./setup.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Minimal valid registration payload */
function registerPayload(overrides = {}) {
  return {
    name: "Auto Tester",
    email: uniqueEmail("register"),
    password: "ValidPass@1234",
    phone: "9000000099",
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe("Auth — Register (POST /api/auth/register)", () => {
  it("creates a new user and returns a JWT token", async () => {
    const payload = registerPayload();
    const { status, body } = await post("/api/auth/register", payload);

    expect(status).toBe(201);
    expect(body).toHaveProperty("token");
    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThan(10);

    // Returned user shape
    expect(body).toHaveProperty("email", payload.email);
    expect(body).toHaveProperty("name", payload.name);
    expect(body).not.toHaveProperty("password"); // password must NOT be returned
  });

  it("returns 400 when registering a duplicate email", async () => {
    const payload = registerPayload();

    // First registration — must succeed
    const first = await post("/api/auth/register", payload);
    expect(first.status).toBe(201);

    // Second registration with same email — must fail
    const { status, body } = await post("/api/auth/register", payload);
    expect(status).toBe(400);
    expect(body.message).toMatch(/already exists/i);
  });

  it("returns 400 when email is missing", async () => {
    const payload = registerPayload({ email: undefined });
    const { status, body } = await post("/api/auth/register", payload);
    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
  });

  it("returns 400 when password is missing", async () => {
    const payload = registerPayload({ password: undefined });
    const { status, body } = await post("/api/auth/register", payload);
    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
  });

  it("returns 400 when name is missing", async () => {
    const payload = registerPayload({ name: undefined });
    const { status, body } = await post("/api/auth/register", payload);
    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
  });

  it("stores email in lower-case regardless of input casing", async () => {
    const lower = uniqueEmail("casetest");
    const upper = lower.toUpperCase();
    const payload = registerPayload({ email: upper });

    const { status, body } = await post("/api/auth/register", payload);
    expect(status).toBe(201);
    expect(body.email).toBe(lower);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Auth — Login (POST /api/auth/login)", () => {
  it("returns a JWT token for valid credentials (customer)", async () => {
    const { status, body } = await post("/api/auth/login", {
      email: CREDENTIALS.user.email,
      password: CREDENTIALS.user.password,
    });

    expect(status).toBe(200);
    expect(body).toHaveProperty("token");
    expect(typeof body.token).toBe("string");
    expect(body).toHaveProperty("email", CREDENTIALS.user.email);
    expect(body).not.toHaveProperty("password");
  });

  it("returns a JWT token for valid credentials (admin)", async () => {
    const { status, body } = await post("/api/auth/login", {
      email: CREDENTIALS.admin.email,
      password: CREDENTIALS.admin.password,
    });

    expect(status).toBe(200);
    expect(body).toHaveProperty("token");
    expect(body.role).toBe("admin");
    expect(body.isAdmin).toBe(true);
  });

  it("returns a JWT token for valid credentials (super-admin)", async () => {
    const { status, body } = await post("/api/auth/login", {
      email: CREDENTIALS.superAdmin.email,
      password: CREDENTIALS.superAdmin.password,
    });

    expect(status).toBe(200);
    expect(body).toHaveProperty("token");
    expect(body.role).toBe("super-admin");
    expect(body.isAdmin).toBe(true);
  });

  it("returns 401 for wrong password", async () => {
    const { status, body } = await post("/api/auth/login", {
      email: CREDENTIALS.user.email,
      password: "WrongPassword999!",
    });

    expect(status).toBe(401);
    expect(body.message).toMatch(/invalid email or password/i);
  });

  it("returns 401 for non-existent email", async () => {
    const { status, body } = await post("/api/auth/login", {
      email: "nobody.exists@bananthi.local",
      password: "AnyPassword@1",
    });

    expect(status).toBe(401);
    expect(body.message).toMatch(/invalid email or password/i);
  });

  it("returns 400 when email field is missing", async () => {
    const { status } = await post("/api/auth/login", { password: "Test@123" });
    expect(status).toBe(400);
  });

  it("returns 400 when password field is missing", async () => {
    const { status } = await post("/api/auth/login", {
      email: CREDENTIALS.user.email,
    });
    expect(status).toBe(400);
  });

  it("is case-insensitive for email at login", async () => {
    const { status, body } = await post("/api/auth/login", {
      email: CREDENTIALS.user.email.toUpperCase(),
      password: CREDENTIALS.user.password,
    });

    expect(status).toBe(200);
    expect(body).toHaveProperty("token");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Auth — Forgot Password (POST /api/auth/forgot-password)", () => {
  it("returns 200 and a message for a registered email", async () => {
    const { status, body } = await post("/api/auth/forgot-password", {
      email: CREDENTIALS.user.email,
    });

    expect(status).toBe(200);
    expect(body).toHaveProperty("message");
    // Must NOT reveal whether the email exists or not in the message text,
    // but our implementation returns a positive message for known emails too —
    // we just confirm it's a 200 with a message string.
    expect(typeof body.message).toBe("string");
    expect(body.message.length).toBeGreaterThan(0);
  });

  it("returns 200 even for an unregistered email (prevents user enumeration)", async () => {
    const { status, body } = await post("/api/auth/forgot-password", {
      email: "totally.unknown@bananthi.local",
    });

    expect(status).toBe(200);
    expect(body).toHaveProperty("message");
  });

  it("returns 400 when email field is omitted", async () => {
    const { status } = await post("/api/auth/forgot-password", {});
    expect(status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Auth — Token validity", () => {
  let freshToken;

  beforeAll(async () => {
    freshToken = await loginAs(CREDENTIALS.user.email, CREDENTIALS.user.password);
  });

  it("loginAs helper returns a non-empty string token", () => {
    expect(typeof freshToken).toBe("string");
    expect(freshToken.length).toBeGreaterThan(20);
  });

  it("token is a valid JWT (three dot-separated base64 segments)", () => {
    const parts = freshToken.split(".");
    expect(parts).toHaveLength(3);
    // Each segment should be non-empty
    parts.forEach((part) => expect(part.length).toBeGreaterThan(0));
  });
});
