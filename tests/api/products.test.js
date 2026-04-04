// tests/api/products.test.js
// ─────────────────────────────────────────────────────────────────────────────
// Product endpoint tests
//
// Covers:
//   GET  /api/products            — list (active only, guest ok)
//   GET  /api/products/:id        — single product by UUID or slug
//   POST /api/products            — create (super-admin only)
//   PUT  /api/products/:id        — update (super-admin only)
//   DELETE /api/products/:id      — soft-delete / deactivate (super-admin only)
//
// Extra business-rule tests:
//   • product.stockQuantity === sum of variant stockQuantities
//   • product.price === Math.min of variant prices  ("From Price" / Changes 5)
//   • setting a variant stock to 0 persists as 0, not 50 (zero-stock bug fix / Changes 5)
//
// Cleanup strategy:
//   A test product is created in beforeAll and deleted (soft) in afterAll.
//   The delete only sets isActive=false, so it is safe to repeat.
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

// ── Module-level state shared across describe blocks ─────────────────────────
let saToken; // super-admin JWT
let adToken; // admin (non-super) JWT
let usToken; // regular user JWT

let createdProductId; // ID of the product we create in beforeAll
let createdProductSlug; // slug of the product we create

// Variant data we send when creating the test product
const TEST_VARIANTS = [
  { unitLabel: "100g", price: 120, stockQuantity: 10, sortOrder: 0 },
  { unitLabel: "250g", price: 280, stockQuantity: 20, sortOrder: 1 },
  { unitLabel: "500g", price: 500, stockQuantity: 5, sortOrder: 2 },
];
const EXPECTED_LOWEST_PRICE = 120; // Math.min(120, 280, 500)
const EXPECTED_TOTAL_STOCK = 35; // 10 + 20 + 5

// ── Global setup ─────────────────────────────────────────────────────────────
beforeAll(async () => {
  [saToken, adToken, usToken] = await Promise.all([
    superAdminToken(),
    adminToken(),
    userToken(),
  ]);

  // Create a test product to use throughout these tests
  const slug = `autotest-product-${Date.now()}`;
  const { status, body } = await post(
    "/api/products",
    {
      name: "Auto Test Powder",
      title: "Auto Test Powder",
      slug,
      description: "Created by automated tests — safe to delete.",
      category: "Organic Powders",
      image: "/images/test.png",
      variants: TEST_VARIANTS,
      isActive: true,
      isBestseller: false,
    },
    saToken,
  );

  if (status !== 201) {
    throw new Error(
      `beforeAll: failed to create test product — HTTP ${status}: ${JSON.stringify(body)}`,
    );
  }

  createdProductId = body._id || body.id;
  createdProductSlug = body.slug;
});

// ── Global teardown ──────────────────────────────────────────────────────────
afterAll(async () => {
  if (createdProductId) {
    // Soft-delete (sets isActive: false) — safe to call even if already inactive
    await del(`/api/products/${createdProductId}`, saToken);
  }
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Products — List (GET /api/products)", () => {
  it("returns an array of products", async () => {
    const { status, body } = await get("/api/products");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it("returns only active products for unauthenticated guests", async () => {
    const { body } = await get("/api/products");
    // Every product returned must be active
    body.forEach((p) => expect(p.isActive).toBe(true));
  });

  it("every product has expected top-level fields", async () => {
    const { body } = await get("/api/products");
    const required = [
      "_id",
      "name",
      "price",
      "stockQuantity",
      "category",
      "isActive",
    ];
    body.forEach((p) => {
      required.forEach((field) => expect(p).toHaveProperty(field));
    });
  });

  it("every product includes a variants array", async () => {
    const { body } = await get("/api/products");
    body.forEach((p) => {
      expect(p).toHaveProperty("variants");
      expect(Array.isArray(p.variants)).toBe(true);
    });
  });

  it("returns newly created test product in the list", async () => {
    const { body } = await get("/api/products");
    const found = body.find((p) => p._id === createdProductId);
    expect(found).toBeTruthy();
  });

  it("does NOT expose soft-deleted products to guests (includeInactive query ignored)", async () => {
    // Even if someone passes ?includeInactive=true without an admin token,
    // inactive products should not appear
    const { body } = await get("/api/products?includeInactive=true");
    body.forEach((p) => expect(p.isActive).toBe(true));
  });

  it("bestseller filter (?bestseller=true) returns only bestseller products", async () => {
    const { status, body } = await get("/api/products?bestseller=true");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    body.forEach((p) => {
      expect(p.isActive).toBe(true);
      expect(p.isBestseller).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Products — Detail (GET /api/products/:id)", () => {
  it("returns the product by UUID", async () => {
    const { status, body } = await get(`/api/products/${createdProductId}`);
    expect(status).toBe(200);
    expect(body._id).toBe(createdProductId);
    expect(body.name).toBe("Auto Test Powder");
  });

  it("returns the product by slug", async () => {
    const { status, body } = await get(`/api/products/${createdProductSlug}`);
    expect(status).toBe(200);
    expect(body._id).toBe(createdProductId);
    expect(body.slug).toBe(createdProductSlug);
  });

  it("includes variants sorted by sortOrder", async () => {
    const { body } = await get(`/api/products/${createdProductId}`);
    expect(Array.isArray(body.variants)).toBe(true);
    expect(body.variants.length).toBe(TEST_VARIANTS.length);

    for (let i = 0; i < body.variants.length - 1; i++) {
      expect(body.variants[i].sortOrder).toBeLessThanOrEqual(
        body.variants[i + 1].sortOrder,
      );
    }
  });

  it("each variant has unitLabel, price, and stockQuantity", async () => {
    const { body } = await get(`/api/products/${createdProductId}`);
    body.variants.forEach((v) => {
      expect(v).toHaveProperty("unitLabel");
      expect(v).toHaveProperty("price");
      expect(v).toHaveProperty("stockQuantity");
      expect(typeof v.price).toBe("number");
      expect(typeof v.stockQuantity).toBe("number");
    });
  });

  it("returns 404 for a non-existent UUID", async () => {
    const { status, body } = await get(
      "/api/products/00000000-0000-0000-0000-000000000000",
    );
    expect(status).toBe(404);
    expect(body).toHaveProperty("message");
  });

  it("returns 404 for a non-existent slug", async () => {
    const { status, body } = await get(
      "/api/products/this-slug-does-not-exist-at-all",
    );
    expect(status).toBe(404);
    expect(body).toHaveProperty("message");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Products — Stock Sync (variant sum === product total)", () => {
  it("product stockQuantity equals sum of all variant stockQuantities", async () => {
    const { body } = await get(`/api/products/${createdProductId}`);

    const variantSum = body.variants.reduce(
      (sum, v) => sum + (v.stockQuantity ?? 0),
      0,
    );
    expect(body.stockQuantity).toBe(variantSum);
  });

  it("stock sum matches the values we seeded", async () => {
    const { body } = await get(`/api/products/${createdProductId}`);
    expect(body.stockQuantity).toBe(EXPECTED_TOTAL_STOCK);
  });

  it("product-level stock stays in sync after a variant update", async () => {
    // Update 100g stock from 10 → 25; expect product total to become 25+20+5 = 50
    const updatedVariants = [
      { unitLabel: "100g", price: 120, stockQuantity: 25, sortOrder: 0 },
      { unitLabel: "250g", price: 280, stockQuantity: 20, sortOrder: 1 },
      { unitLabel: "500g", price: 500, stockQuantity: 5, sortOrder: 2 },
    ];

    const { status } = await put(
      `/api/products/${createdProductId}`,
      { variants: updatedVariants },
      saToken,
    );
    expect(status).toBe(200);

    const { body } = await get(`/api/products/${createdProductId}`);
    const expectedSum = 25 + 20 + 5;
    expect(body.stockQuantity).toBe(expectedSum);

    // Confirm individual variant
    const v100 = body.variants.find((v) => v.unitLabel === "100g");
    expect(v100?.stockQuantity).toBe(25);
  });

  it("restores original variant stocks for subsequent tests", async () => {
    const { status } = await put(
      `/api/products/${createdProductId}`,
      { variants: TEST_VARIANTS },
      saToken,
    );
    expect(status).toBe(200);

    const { body } = await get(`/api/products/${createdProductId}`);
    expect(body.stockQuantity).toBe(EXPECTED_TOTAL_STOCK);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Products — From Price / Lowest Price (Changes 5 — T13.1)", () => {
  it("product.price equals Math.min of all variant prices", async () => {
    const { body } = await get(`/api/products/${createdProductId}`);

    const minVariantPrice = Math.min(...body.variants.map((v) => v.price));
    expect(body.price).toBe(minVariantPrice);
    expect(body.price).toBe(EXPECTED_LOWEST_PRICE);
  });

  it("price re-computes to new minimum after variant update", async () => {
    // Add a cheaper variant (50 rupees) — price should drop to 50
    const cheaperVariants = [
      { unitLabel: "50g", price: 50, stockQuantity: 5, sortOrder: 0 },
      { unitLabel: "100g", price: 120, stockQuantity: 10, sortOrder: 1 },
      { unitLabel: "250g", price: 280, stockQuantity: 20, sortOrder: 2 },
    ];

    const { status, body: updated } = await put(
      `/api/products/${createdProductId}`,
      { variants: cheaperVariants },
      saToken,
    );
    expect(status).toBe(200);
    expect(updated.price).toBe(50);

    // Restore original variants
    await put(
      `/api/products/${createdProductId}`,
      { variants: TEST_VARIANTS },
      saToken,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Products — Zero-Stock Bug Fix (Changes 5 — T13.4)", () => {
  it("saves stockQuantity: 0 correctly without defaulting to 50", async () => {
    // Set the 500g variant stock explicitly to 0
    const zeroStockVariants = [
      { unitLabel: "100g", price: 120, stockQuantity: 10, sortOrder: 0 },
      { unitLabel: "250g", price: 280, stockQuantity: 20, sortOrder: 1 },
      { unitLabel: "500g", price: 500, stockQuantity: 0, sortOrder: 2 }, // ← zero
    ];

    const { status } = await put(
      `/api/products/${createdProductId}`,
      { variants: zeroStockVariants },
      saToken,
    );
    expect(status).toBe(200);

    // Re-fetch and verify 0 is persisted, not reset to 50
    const { body } = await get(`/api/products/${createdProductId}`);
    const v500 = body.variants.find((v) => v.unitLabel === "500g");

    expect(v500).toBeTruthy();
    expect(v500.stockQuantity).toBe(0); // must be 0, not 50
  });

  it("product total stock reflects the 0 correctly", async () => {
    const { body } = await get(`/api/products/${createdProductId}`);
    // 10 + 20 + 0 = 30
    expect(body.stockQuantity).toBe(30);

    // Restore
    await put(
      `/api/products/${createdProductId}`,
      { variants: TEST_VARIANTS },
      saToken,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Products — CRUD Auth Guards", () => {
  it("POST /api/products returns 401 for unauthenticated request", async () => {
    const { status } = await post("/api/products", {
      name: "Sneaky Product",
      image: "/images/test.png",
      price: 100,
      category: "General",
    });
    expect(status).toBe(401);
  });

  it("POST /api/products returns 403 for a regular user", async () => {
    const { status } = await post(
      "/api/products",
      {
        name: "Sneaky Product",
        image: "/images/test.png",
        price: 100,
        category: "General",
      },
      usToken,
    );
    expect(status).toBe(403);
  });

  it("POST /api/products returns 403 for an admin (non-super)", async () => {
    const { status } = await post(
      "/api/products",
      {
        name: "Sneaky Product",
        image: "/images/test.png",
        price: 100,
        category: "General",
      },
      adToken,
    );
    expect(status).toBe(403);
  });

  it("POST /api/products returns 201 for super-admin", async () => {
    const slug = `guard-test-${Date.now()}`;
    const { status, body } = await post(
      "/api/products",
      {
        name: "Guard Test Product",
        slug,
        image: "/images/test.png",
        price: 99,
        category: "General",
        description: "Temporary — safe to delete",
      },
      saToken,
    );
    expect(status).toBe(201);
    expect(body).toHaveProperty("_id");

    // Clean up
    await del(`/api/products/${body._id}`, saToken);
  });

  it("PUT /api/products/:id returns 403 for a regular user", async () => {
    const { status } = await put(
      `/api/products/${createdProductId}`,
      { description: "Hacked" },
      usToken,
    );
    expect(status).toBe(403);
  });

  it("PUT /api/products/:id returns 403 for admin (non-super)", async () => {
    const { status } = await put(
      `/api/products/${createdProductId}`,
      { description: "Hacked" },
      adToken,
    );
    expect(status).toBe(403);
  });

  it("DELETE /api/products/:id returns 403 for a regular user", async () => {
    const { status } = await del(`/api/products/${createdProductId}`, usToken);
    expect(status).toBe(403);
  });

  it("DELETE /api/products/:id returns 403 for admin (non-super)", async () => {
    const { status } = await del(`/api/products/${createdProductId}`, adToken);
    expect(status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Products — Create validation", () => {
  it("returns 400 when name/title is missing", async () => {
    const { status, body } = await post(
      "/api/products",
      { image: "/images/test.png", price: 100, category: "General" },
      saToken,
    );
    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
  });

  it("returns 400 when image is missing", async () => {
    const { status, body } = await post(
      "/api/products",
      { name: "No Image Product", price: 100, category: "General" },
      saToken,
    );
    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
  });

  it("returns 400 when neither price nor variants are provided", async () => {
    const { status, body } = await post(
      "/api/products",
      {
        name: "No Price Product",
        image: "/images/test.png",
        category: "General",
      },
      saToken,
    );
    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
  });

  it("returns 400 when a duplicate slug is used", async () => {
    // Use the already-created product's slug
    const { status, body } = await post(
      "/api/products",
      {
        name: "Duplicate Slug Product",
        slug: createdProductSlug,
        image: "/images/test.png",
        price: 100,
        category: "General",
      },
      saToken,
    );
    expect(status).toBe(400);
    expect(body.message).toMatch(/slug already exists/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Products — Update and soft-delete", () => {
  it("PUT /api/products/:id updates name and returns updated product", async () => {
    // Use explicit unique slugs so auto-generation never collides across runs
    const updatedSlug = `auto-test-powder-updated-${Date.now()}`;

    const { status, body } = await put(
      `/api/products/${createdProductId}`,
      { name: "Auto Test Powder (updated)", slug: updatedSlug },
      saToken,
    );
    expect(status).toBe(200);
    expect(body.name).toBe("Auto Test Powder (updated)");

    // Restore original name and original slug so the rest of the tests are unaffected
    await put(
      `/api/products/${createdProductId}`,
      { name: "Auto Test Powder", slug: createdProductSlug },
      saToken,
    );
  });

  it("PUT /api/products/:id updates description", async () => {
    const { status, body } = await put(
      `/api/products/${createdProductId}`,
      { description: "Updated description text." },
      saToken,
    );
    expect(status).toBe(200);
    expect(body.description).toBe("Updated description text.");
  });

  it("PUT /api/products/:id updates keyBenefits, howToUse, shippingReturns", async () => {
    const { status, body } = await put(
      `/api/products/${createdProductId}`,
      {
        keyBenefits: "Rich in antioxidants",
        howToUse: "Take one teaspoon daily",
        shippingReturns: "Ships within 2 days",
      },
      saToken,
    );
    expect(status).toBe(200);
    expect(body.keyBenefits).toBe("Rich in antioxidants");
    expect(body.howToUse).toBe("Take one teaspoon daily");
    expect(body.shippingReturns).toBe("Ships within 2 days");
  });

  it("PUT /api/products/:id returns 404 for non-existent UUID", async () => {
    const { status } = await put(
      "/api/products/00000000-0000-0000-0000-000000000000",
      { name: "Ghost" },
      saToken,
    );
    expect(status).toBe(404);
  });

  it("DELETE /api/products/:id soft-deletes (sets isActive=false)", async () => {
    // Create a temporary product to delete — timestamp in name/slug prevents
    // slug collision on repeated test runs
    const tempSlug = `temp-delete-test-${Date.now()}`;
    const { body: created } = await post(
      "/api/products",
      {
        name: `Temp Delete Test ${Date.now()}`,
        slug: tempSlug,
        image: "/images/test.png",
        price: 50,
        category: "General",
        description: "Will be deleted",
      },
      saToken,
    );

    const tempId = created._id || created.id;
    expect(tempId).toBeTruthy();

    // Delete it
    const { status, body } = await del(`/api/products/${tempId}`, saToken);
    expect(status).toBe(200);
    expect(body.message).toMatch(/deactivated/i);

    // Should no longer appear in public product list
    const { body: list } = await get("/api/products");
    const stillVisible = list.find((p) => p._id === tempId);
    expect(stillVisible).toBeFalsy();
  });
});
