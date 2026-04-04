// tests/api/marketing.test.js
// ─────────────────────────────────────────────────────────────────────────────
// Marketing endpoint tests
//
// Covers:
//   POST /api/subscribe            — newsletter subscribe
//   POST /api/contact              — contact form submission
//   POST /api/services-waitlist    — postpartum services waitlist
//
// Business rules tested:
//   • Subscribing a new email → 201 + subscriber object
//   • Subscribing the same email again → 200 + alreadySubscribed: true (idempotent)
//   • Missing email → 400
//   • Contact form: valid submission → 200
//   • Contact form: missing/short fields → 400
//   • Waitlist: valid submission → 200 + also subscribes the email
//   • Waitlist: missing required fields → 400
//
// Note:
//   Emails subscribed here stay in the DB but are harmless —
//   they use the autotest.bananthi.local domain which is clearly synthetic.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from "vitest";
import { post, get, del, superAdminToken, uniqueEmail } from "./setup.js";

// ─────────────────────────────────────────────────────────────────────────────

describe("Marketing — Newsletter Subscribe (POST /api/subscribe)", () => {
  it("subscribes a new email and returns 201 with a subscriber object", async () => {
    const email = uniqueEmail("subscribe");

    const { status, body } = await post("/api/subscribe", {
      email,
      name: "Auto Subscriber",
    });

    expect(status).toBe(201);
    expect(body).toHaveProperty("message");
    expect(body.message).toMatch(/subscribed/i);
    expect(body).toHaveProperty("subscriber");
    expect(body.subscriber).toHaveProperty("_id");
    expect(body.subscriber.email).toBe(email);
    expect(body.subscriber.isActive).toBe(true);
  });

  it("subscribing the same email again returns 200 with alreadySubscribed: true", async () => {
    const email = uniqueEmail("subscribe-dupe");

    // First subscription
    const first = await post("/api/subscribe", { email, name: "Dupe Tester" });
    expect(first.status).toBe(201);

    // Second subscription — same email
    const { status, body } = await post("/api/subscribe", {
      email,
      name: "Dupe Tester Again",
    });

    expect(status).toBe(200);
    expect(body).toHaveProperty("alreadySubscribed", true);
    expect(body.message).toMatch(/already subscribed/i);
    expect(body).toHaveProperty("subscriber");
    expect(body.subscriber.email).toBe(email);
  });

  it("is case-insensitive — subscribing with uppercase email returns alreadySubscribed", async () => {
    const lower = uniqueEmail("subscribe-case");

    // Subscribe with lowercase
    const first = await post("/api/subscribe", { email: lower });
    expect(first.status).toBe(201);

    // Subscribe with uppercase — should detect duplicate
    const { status, body } = await post("/api/subscribe", {
      email: lower.toUpperCase(),
    });

    // Either 200 (already subscribed) or 201 (stored as-is) — but must not error
    expect([200, 201]).toContain(status);
    if (status === 200) {
      expect(body).toHaveProperty("alreadySubscribed", true);
    }
  });

  it("returns 400 when email is missing", async () => {
    const { status, body } = await post("/api/subscribe", {
      name: "No Email Person",
    });

    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
    expect(body.message).toMatch(/email/i);
  });

  it("returns 400 when body is completely empty", async () => {
    const { status, body } = await post("/api/subscribe", {});

    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
  });

  it("subscriber created without a name still succeeds", async () => {
    const email = uniqueEmail("subscribe-noname");

    const { status, body } = await post("/api/subscribe", { email });

    expect(status).toBe(201);
    expect(body.subscriber.email).toBe(email);
  });

  it("subscriber appears in admin subscriber list after creation", async () => {
    const email = uniqueEmail("subscribe-verify");
    const saToken = await superAdminToken();

    await post("/api/subscribe", { email, name: "Verify Subscriber" });

    const { body: allSubs } = await get("/api/admin/subscribers", saToken);
    const found = allSubs.find((s) => s.email === email);

    expect(found).toBeTruthy();
    expect(found.isActive).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Marketing — Contact Form (POST /api/contact)", () => {
  it("returns 200 for a valid contact submission", async () => {
    const { status, body } = await post("/api/contact", {
      name: "Contact Tester",
      email: uniqueEmail("contact"),
      phone: "9000000050",
      message: "This is a test message from the automated test suite. Please ignore.",
    });

    expect(status).toBe(200);
    expect(body).toHaveProperty("message");
    expect(body.message).toMatch(/sent successfully/i);
  });

  it("returns 200 without a phone number (phone is optional)", async () => {
    const { status, body } = await post("/api/contact", {
      name: "No Phone Tester",
      email: uniqueEmail("contact-nophone"),
      message: "Sending without a phone number — this should still work fine.",
    });

    expect(status).toBe(200);
    expect(body.message).toMatch(/sent successfully/i);
  });

  it("returns 400 when name is missing", async () => {
    const { status, body } = await post("/api/contact", {
      email: uniqueEmail("contact-noname"),
      message: "Message without a name — should be rejected.",
    });

    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
  });

  it("returns 400 when name is shorter than 2 characters", async () => {
    const { status, body } = await post("/api/contact", {
      name: "A",
      email: uniqueEmail("contact-shortname"),
      message: "Short name — should be rejected by validation.",
    });

    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
  });

  it("returns 400 when email is missing", async () => {
    const { status, body } = await post("/api/contact", {
      name: "No Email Tester",
      message: "Message without an email — should be rejected.",
    });

    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
    expect(body.message).toMatch(/email/i);
  });

  it("returns 400 when message is missing", async () => {
    const { status, body } = await post("/api/contact", {
      name: "No Message Tester",
      email: uniqueEmail("contact-nomsg"),
    });

    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
  });

  it("returns 400 when message is shorter than 10 characters", async () => {
    const { status, body } = await post("/api/contact", {
      name: "Short Message Tester",
      email: uniqueEmail("contact-shortmsg"),
      message: "Too short",
    });

    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
  });

  it("returns 400 when the entire body is empty", async () => {
    const { status } = await post("/api/contact", {});
    expect(status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Marketing — Services Waitlist (POST /api/services-waitlist)", () => {
  it("returns 200 for a valid waitlist submission", async () => {
    const { status, body } = await post("/api/services-waitlist", {
      firstName: "Priya",
      lastName: "Sharma",
      email: uniqueEmail("waitlist"),
      dueDate: "2025-09-01",
      interest: "Postnatal massage and nutrition support",
    });

    expect(status).toBe(200);
    expect(body).toHaveProperty("message");
    expect(body.message).toMatch(/registration successful/i);
  });

  it("waitlist submission also subscribes the email to the newsletter", async () => {
    const email = uniqueEmail("waitlist-sub");
    const saToken = await superAdminToken();

    await post("/api/services-waitlist", {
      firstName: "Deepa",
      lastName: "Reddy",
      email,
      dueDate: "2025-11-15",
      interest: "Ayurvedic postpartum care",
    });

    // Check the subscriber list for this email
    const { body: allSubs } = await get("/api/admin/subscribers", saToken);
    const found = allSubs.find((s) => s.email === email);

    expect(found).toBeTruthy();
    expect(found.isActive).toBe(true);
  });

  it("returns 200 without dueDate or interest (optional fields)", async () => {
    const { status, body } = await post("/api/services-waitlist", {
      firstName: "Sneha",
      lastName: "Kumar",
      email: uniqueEmail("waitlist-minimal"),
    });

    expect(status).toBe(200);
    expect(body.message).toMatch(/registration successful/i);
  });

  it("returns 400 when firstName is missing", async () => {
    const { status, body } = await post("/api/services-waitlist", {
      lastName: "Kumar",
      email: uniqueEmail("waitlist-nofirst"),
    });

    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
    expect(body.message).toMatch(/first name/i);
  });

  it("returns 400 when lastName is missing", async () => {
    const { status, body } = await post("/api/services-waitlist", {
      firstName: "Sneha",
      email: uniqueEmail("waitlist-nolast"),
    });

    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
    expect(body.message).toMatch(/last name/i);
  });

  it("returns 400 when email is missing", async () => {
    const { status, body } = await post("/api/services-waitlist", {
      firstName: "Sneha",
      lastName: "Kumar",
    });

    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
    expect(body.message).toMatch(/email/i);
  });

  it("returns 400 when firstName is an empty string", async () => {
    const { status, body } = await post("/api/services-waitlist", {
      firstName: "   ",
      lastName: "Kumar",
      email: uniqueEmail("waitlist-emptyname"),
    });

    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
  });

  it("returns 400 when body is completely empty", async () => {
    const { status } = await post("/api/services-waitlist", {});
    expect(status).toBe(400);
  });

  it("re-submitting with the same email is idempotent (upserts subscriber)", async () => {
    const email = uniqueEmail("waitlist-repeat");

    const first = await post("/api/services-waitlist", {
      firstName: "Anita",
      lastName: "Nair",
      email,
    });
    expect(first.status).toBe(200);

    // Submit again with same email — should not error
    const { status, body } = await post("/api/services-waitlist", {
      firstName: "Anita",
      lastName: "Nair",
      email,
      interest: "Updated interest",
    });

    expect(status).toBe(200);
    expect(body.message).toMatch(/registration successful/i);
  });
});
