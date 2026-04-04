// tests/api/health.test.js
import { describe, it, expect } from "vitest";
import { get } from "./setup.js";

describe("Health", () => {
  it("GET /api/health returns { status: 'ok' }", async () => {
    const { status, body } = await get("/api/health");
    expect(status).toBe(200);
    expect(body).toMatchObject({ status: "ok" });
  });
});
