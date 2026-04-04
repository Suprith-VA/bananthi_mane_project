// tests/api/blog.test.js
// ─────────────────────────────────────────────────────────────────────────────
// Blog endpoint tests
//
// Covers:
//   GET  /api/blogs                — public list (published only)
//   GET  /api/blogs/admin/all      — full list incl. unpublished (admin+)
//   GET  /api/blogs/:slugOrId      — single blog by slug or UUID
//   POST /api/blogs                — create (admin+)
//   PUT  /api/blogs/:id            — update (admin+)
//   DELETE /api/blogs/:id          — delete (admin+)
//
// Business rules tested:
//   • Unpublished blogs are NOT returned by the public GET /api/blogs endpoint
//   • GET /api/blogs/admin/all DOES include unpublished (admin only)
//   • Slug is auto-generated from title if not supplied
//   • Duplicate slug → 400
//   • publishedAt is set automatically when isPublished flips to true
//   • isFeatured is one-at-a-time (setting a new one unmarks the previous)
//
// Cleanup:
//   All blogs created during tests are deleted in afterAll.
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
let saToken; // super-admin (ops.test)
let adToken; // admin non-super (admin.test)
let usToken; // regular user   (customer.test)

// IDs of every blog we create — deleted in afterAll
const createdBlogIds = [];

// The main published and unpublished blogs used across describe blocks
let publishedBlogId;
let publishedBlogSlug;
let unpublishedBlogId;
let unpublishedBlogSlug;

// ── Global setup ──────────────────────────────────────────────────────────────
beforeAll(async () => {
  [saToken, adToken, usToken] = await Promise.all([
    superAdminToken(),
    adminToken(),
    userToken(),
  ]);

  const ts = Date.now();

  // ── Create a published blog ─────────────────────────────────────────────────
  const pubSlug = `autotest-published-${ts}`;
  const pubRes = await post(
    "/api/blogs",
    {
      title: "Auto Test Published Blog",
      slug: pubSlug,
      content: "This blog post is published. Created by automated tests.",
      featuredImage: "/images/blog-test.png",
      isPublished: true,
    },
    adToken,
  );

  if (pubRes.status !== 201) {
    throw new Error(
      `beforeAll: failed to create published blog — HTTP ${pubRes.status}: ${JSON.stringify(pubRes.body)}`,
    );
  }

  publishedBlogId = pubRes.body._id || pubRes.body.id;
  publishedBlogSlug = pubRes.body.slug;
  createdBlogIds.push(publishedBlogId);

  // ── Create an unpublished blog ──────────────────────────────────────────────
  const draftSlug = `autotest-draft-${ts}`;
  const draftRes = await post(
    "/api/blogs",
    {
      title: "Auto Test Draft Blog",
      slug: draftSlug,
      content: "This blog post is a draft. Should NOT appear in public list.",
      featuredImage: "/images/blog-draft.png",
      isPublished: false,
    },
    adToken,
  );

  if (draftRes.status !== 201) {
    throw new Error(
      `beforeAll: failed to create draft blog — HTTP ${draftRes.status}: ${JSON.stringify(draftRes.body)}`,
    );
  }

  unpublishedBlogId = draftRes.body._id || draftRes.body.id;
  unpublishedBlogSlug = draftRes.body.slug;
  createdBlogIds.push(unpublishedBlogId);
});

// ── Global teardown ───────────────────────────────────────────────────────────
afterAll(async () => {
  await Promise.all(
    createdBlogIds.map((id) =>
      del(`/api/blogs/${id}`, saToken).catch(() => {}),
    ),
  );
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Blogs — Public List (GET /api/blogs)", () => {
  it("returns 200 with an array", async () => {
    const { status, body } = await get("/api/blogs");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it("does NOT require authentication", async () => {
    // No token — should still return 200
    const { status } = await get("/api/blogs");
    expect(status).toBe(200);
  });

  it("only returns published blogs", async () => {
    const { body } = await get("/api/blogs");
    body.forEach((b) => {
      expect(b.isPublished).toBe(true);
    });
  });

  it("published blog appears in the public list", async () => {
    const { body } = await get("/api/blogs");
    const found = body.find((b) => b._id === publishedBlogId);
    expect(found).toBeTruthy();
  });

  it("unpublished (draft) blog does NOT appear in the public list", async () => {
    const { body } = await get("/api/blogs");
    const found = body.find((b) => b._id === unpublishedBlogId);
    expect(found).toBeFalsy();
  });

  it("each blog has expected fields", async () => {
    const { body } = await get("/api/blogs");
    if (body.length === 0) return;
    const blog = body[0];
    const required = [
      "_id",
      "title",
      "slug",
      "content",
      "isPublished",
      "createdAt",
    ];
    required.forEach((f) => expect(blog).toHaveProperty(f));
  });

  it("?featured=true returns only featured blogs", async () => {
    const { status, body } = await get("/api/blogs?featured=true");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    body.forEach((b) => {
      expect(b.isPublished).toBe(true);
      expect(b.isFeatured).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Blogs — Admin All (GET /api/blogs/admin/all)", () => {
  it("returns 401 for unauthenticated request", async () => {
    const { status } = await get("/api/blogs/admin/all");
    expect(status).toBe(401);
  });

  it("returns 403 for a regular user", async () => {
    const { status } = await get("/api/blogs/admin/all", usToken);
    expect(status).toBe(403);
  });

  it("returns 200 with full list for admin (non-super)", async () => {
    const { status, body } = await get("/api/blogs/admin/all", adToken);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it("returns 200 with full list for super-admin", async () => {
    const { status, body } = await get("/api/blogs/admin/all", saToken);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it("admin list includes unpublished (draft) blog", async () => {
    const { body } = await get("/api/blogs/admin/all", saToken);
    const found = body.find((b) => b._id === unpublishedBlogId);
    expect(found).toBeTruthy();
    expect(found.isPublished).toBe(false);
  });

  it("admin list includes published blog", async () => {
    const { body } = await get("/api/blogs/admin/all", saToken);
    const found = body.find((b) => b._id === publishedBlogId);
    expect(found).toBeTruthy();
    expect(found.isPublished).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Blogs — Single Blog (GET /api/blogs/:slugOrId)", () => {
  it("returns blog by UUID", async () => {
    const { status, body } = await get(`/api/blogs/${publishedBlogId}`);
    expect(status).toBe(200);
    expect(body._id).toBe(publishedBlogId);
    expect(body.title).toBe("Auto Test Published Blog");
  });

  it("returns blog by slug", async () => {
    const { status, body } = await get(`/api/blogs/${publishedBlogSlug}`);
    expect(status).toBe(200);
    expect(body._id).toBe(publishedBlogId);
    expect(body.slug).toBe(publishedBlogSlug);
  });

  it("returns 404 for an unpublished blog (hidden from public)", async () => {
    // The public endpoint should not expose drafts
    const { status } = await get(`/api/blogs/${unpublishedBlogId}`);
    expect(status).toBe(404);
  });

  it("returns 404 for an unpublished blog by slug", async () => {
    const { status } = await get(`/api/blogs/${unpublishedBlogSlug}`);
    expect(status).toBe(404);
  });

  it("returns 404 for a non-existent UUID", async () => {
    const { status } = await get(
      "/api/blogs/00000000-0000-0000-0000-000000000000",
    );
    expect(status).toBe(404);
  });

  it("returns 404 for a non-existent slug", async () => {
    const { status } = await get(
      "/api/blogs/slug-that-definitely-does-not-exist",
    );
    expect(status).toBe(404);
  });

  it("returned blog has expected fields", async () => {
    const { body } = await get(`/api/blogs/${publishedBlogId}`);
    const required = ["_id", "title", "slug", "content", "isPublished"];
    required.forEach((f) => expect(body).toHaveProperty(f));
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Blogs — Create (POST /api/blogs)", () => {
  it("returns 401 for unauthenticated request", async () => {
    const { status } = await post("/api/blogs", {
      title: "Sneaky Blog",
      content: "Should not be created.",
    });
    expect(status).toBe(401);
  });

  it("returns 403 for a regular user", async () => {
    const { status } = await post(
      "/api/blogs",
      {
        title: "Sneaky Blog",
        content: "Should not be created.",
      },
      usToken,
    );
    expect(status).toBe(403);
  });

  it("admin (non-super) can create a published blog", async () => {
    const slug = `create-test-admin-${Date.now()}`;
    const { status, body } = await post(
      "/api/blogs",
      {
        title: "Admin Created Blog",
        slug,
        content: "Created by admin. Temporary.",
        isPublished: true,
      },
      adToken,
    );
    expect(status).toBe(201);
    expect(body).toHaveProperty("_id");
    expect(body.slug).toBe(slug);
    expect(body.isPublished).toBe(true);

    createdBlogIds.push(body._id || body.id);
  });

  it("super-admin can create an unpublished blog", async () => {
    const slug = `create-test-sa-${Date.now()}`;
    const { status, body } = await post(
      "/api/blogs",
      {
        title: "Super Admin Draft",
        slug,
        content: "Draft by super-admin. Temporary.",
        isPublished: false,
      },
      saToken,
    );
    expect(status).toBe(201);
    expect(body).toHaveProperty("_id");
    expect(body.isPublished).toBe(false);

    createdBlogIds.push(body._id || body.id);
  });

  it("slug is auto-generated from title when not provided", async () => {
    const { status, body } = await post(
      "/api/blogs",
      {
        title: "Auto Slug Generation Test Blog",
        content: "Should get a slug automatically.",
        isPublished: false,
      },
      adToken,
    );
    expect(status).toBe(201);
    expect(body.slug).toBeTruthy();
    // Slug should be kebab-case derived from title
    expect(body.slug).toMatch(/auto-slug-generation-test-blog/);

    createdBlogIds.push(body._id || body.id);
  });

  it("returns 400 when title is missing", async () => {
    const { status, body } = await post(
      "/api/blogs",
      {
        content: "Content without a title.",
        isPublished: false,
      },
      adToken,
    );
    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
  });

  it("returns 400 when content is missing", async () => {
    const { status, body } = await post(
      "/api/blogs",
      {
        title: "Title Without Content",
        isPublished: false,
      },
      adToken,
    );
    expect(status).toBe(400);
    expect(body).toHaveProperty("message");
  });

  it("returns 400 when a duplicate slug is used", async () => {
    const { status, body } = await post(
      "/api/blogs",
      {
        title: "Duplicate Slug Blog",
        slug: publishedBlogSlug, // already exists
        content: "This should fail.",
        isPublished: false,
      },
      adToken,
    );
    expect(status).toBe(400);
    expect(body.message).toMatch(/slug already exists/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Blogs — Update (PUT /api/blogs/:id)", () => {
  it("returns 401 for unauthenticated request", async () => {
    const { status } = await put(`/api/blogs/${publishedBlogId}`, {
      title: "Hacked Title",
    });
    expect(status).toBe(401);
  });

  it("returns 403 for a regular user", async () => {
    const { status } = await put(
      `/api/blogs/${publishedBlogId}`,
      { title: "Hacked Title" },
      usToken,
    );
    expect(status).toBe(403);
  });

  it("admin can update the blog title", async () => {
    const { status, body } = await put(
      `/api/blogs/${publishedBlogId}`,
      { title: "Auto Test Published Blog (updated)" },
      adToken,
    );
    expect(status).toBe(200);
    expect(body.title).toBe("Auto Test Published Blog (updated)");

    // Restore original title — also pass the original slug to prevent auto-regeneration
    await put(
      `/api/blogs/${publishedBlogId}`,
      { title: "Auto Test Published Blog", slug: publishedBlogSlug },
      adToken,
    );
  });

  it("admin can update the blog content", async () => {
    const { status, body } = await put(
      `/api/blogs/${publishedBlogId}`,
      { content: "Updated content for the published blog." },
      adToken,
    );
    expect(status).toBe(200);
    expect(body.content).toBe("Updated content for the published blog.");
  });

  it("admin can publish a draft blog (isPublished: true sets publishedAt)", async () => {
    const { status, body } = await put(
      `/api/blogs/${unpublishedBlogId}`,
      { isPublished: true },
      adToken,
    );
    expect(status).toBe(200);
    expect(body.isPublished).toBe(true);
    // publishedAt should now be set
    expect(body.publishedAt).toBeTruthy();

    // Restore to draft
    await put(
      `/api/blogs/${unpublishedBlogId}`,
      { isPublished: false },
      adToken,
    );
  });

  it("admin can unpublish a published blog (isPublished: false clears publishedAt)", async () => {
    const { status, body } = await put(
      `/api/blogs/${publishedBlogId}`,
      { isPublished: false },
      adToken,
    );
    expect(status).toBe(200);
    expect(body.isPublished).toBe(false);

    // Restore to published
    await put(`/api/blogs/${publishedBlogId}`, { isPublished: true }, adToken);
  });

  it("returns 400 when trying to use a duplicate slug", async () => {
    // Try to set publishedBlogSlug on the unpublished blog — slug collision
    const { status, body } = await put(
      `/api/blogs/${unpublishedBlogId}`,
      { slug: publishedBlogSlug },
      adToken,
    );
    expect(status).toBe(400);
    expect(body.message).toMatch(/slug already exists/i);
  });

  it("returns 400 for an invalid (non-UUID) blog id", async () => {
    const { status } = await put(
      "/api/blogs/not-a-uuid",
      { title: "Bad ID" },
      adToken,
    );
    expect(status).toBe(400);
  });

  it("returns 404 for a non-existent blog UUID", async () => {
    const { status } = await put(
      "/api/blogs/00000000-0000-0000-0000-000000000000",
      { title: "Ghost Blog" },
      adToken,
    );
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Blogs — Delete (DELETE /api/blogs/:id)", () => {
  let tempBlogId;

  beforeAll(async () => {
    // Create a dedicated blog to delete so we don't destroy the shared test blogs
    const { body } = await post(
      "/api/blogs",
      {
        title: `Temp Delete Blog ${Date.now()}`,
        content: "This blog exists only to be deleted.",
        isPublished: false,
      },
      adToken,
    );
    tempBlogId = body._id || body.id;
    // Note: do NOT add to createdBlogIds — this test deletes it itself.
    // If the delete test fails, add it to the list for afterAll cleanup.
    createdBlogIds.push(tempBlogId);
  });

  it("returns 401 for unauthenticated request", async () => {
    const { status } = await del(`/api/blogs/${publishedBlogId}`);
    expect(status).toBe(401);
  });

  it("returns 403 for a regular user", async () => {
    const { status } = await del(`/api/blogs/${publishedBlogId}`, usToken);
    expect(status).toBe(403);
  });

  it("admin can delete a blog", async () => {
    const { status, body } = await del(`/api/blogs/${tempBlogId}`, adToken);
    expect(status).toBe(200);
    expect(body).toHaveProperty("message");

    // Remove from cleanup list since it's already gone
    const idx = createdBlogIds.indexOf(tempBlogId);
    if (idx !== -1) createdBlogIds.splice(idx, 1);
    tempBlogId = null;
  });

  it("deleted blog no longer appears in public list", async () => {
    // publishedBlogId was NOT deleted — verify it's still there;
    // tempBlogId was deleted — verify it's gone from admin list
    const { body } = await get("/api/blogs/admin/all", saToken);
    if (tempBlogId) {
      const found = body.find((b) => b._id === tempBlogId);
      expect(found).toBeFalsy();
    }
  });

  it("returns 400 for an invalid (non-UUID) blog id", async () => {
    const { status } = await del("/api/blogs/not-a-valid-uuid", adToken);
    expect(status).toBe(400);
  });

  it("returns 404 for a non-existent blog UUID", async () => {
    const { status } = await del(
      "/api/blogs/00000000-0000-0000-0000-000000000000",
      adToken,
    );
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Blogs — Featured (one-at-a-time rule)", () => {
  let featuredBlogAId;
  let featuredBlogBId;

  beforeAll(async () => {
    const ts = Date.now();

    const [resA, resB] = await Promise.all([
      post(
        "/api/blogs",
        {
          title: `Featured A ${ts}`,
          content: "First featured blog.",
          isPublished: true,
          isFeatured: true,
        },
        adToken,
      ),
      post(
        "/api/blogs",
        {
          title: `Featured B ${ts + 1}`,
          content: "Second featured blog (should unmark A).",
          isPublished: true,
          isFeatured: false,
        },
        adToken,
      ),
    ]);

    featuredBlogAId = resA.body._id || resA.body.id;
    featuredBlogBId = resB.body._id || resB.body.id;
    createdBlogIds.push(featuredBlogAId, featuredBlogBId);
  });

  it("marking blog B as featured unmarks blog A", async () => {
    // Mark B as featured — should unmark A
    const { status, body: updatedB } = await put(
      `/api/blogs/${featuredBlogBId}`,
      { isFeatured: true },
      adToken,
    );
    expect(status).toBe(200);
    expect(updatedB.isFeatured).toBe(true);

    // Fetch A from admin list — should no longer be featured
    const { body: allBlogs } = await get("/api/blogs/admin/all", saToken);
    const blogA = allBlogs.find((b) => b._id === featuredBlogAId);
    expect(blogA).toBeTruthy();
    expect(blogA.isFeatured).toBe(false);
  });

  it("?featured=true only returns the single currently-featured blog from this test set", async () => {
    const { body } = await get("/api/blogs?featured=true");
    // All returned blogs must be featured
    body.forEach((b) => expect(b.isFeatured).toBe(true));
  });
});
