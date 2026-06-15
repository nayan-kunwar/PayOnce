import { describe, expect, test } from "bun:test";
import request from "supertest";

import app from "../../src/app.js";

describe("API documentation", () => {
  test("GET /openapi.yaml returns the OpenAPI specification", async () => {
    const response = await request(app).get("/openapi.yaml");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/yaml/);
    expect(response.text).toContain("openapi: 3.1.0");
    expect(response.text).toContain("PayOnce API");
    expect(response.text).toContain("/api/v1/payments");
  });

  test("GET /docs returns Scalar API reference HTML", async () => {
    const response = await request(app).get("/docs");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/html/);
    expect(response.text).toContain("PayOnce API Reference");
    expect(response.text).toContain("payonce-docs-nav");
    expect(response.text).toContain("/openapi.yaml");
    expect(response.text).toContain("cdn.jsdelivr.net");
    expect(response.text).toContain('property="csp-nonce"');
    expect(response.text).toMatch(/nonce="[^"]+"/);
  });
});
