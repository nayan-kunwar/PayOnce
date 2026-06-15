import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import request from "supertest";

import app from "../../src/app.js";
import { redis } from "../../src/db/redis.js";
import { resetTestData } from "../helpers/testUtils.js";

function requireCookies(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error("Expected Set-Cookie header");
  }
  return value;
}

async function setupUserAndKey() {
  const signup = await request(app).post("/auth/signup").send({
    email: "usage@example.com",
    password: "supersecret4",
  });
  const cookies = requireCookies(signup.headers["set-cookie"]);

  const key = await request(app)
    .post("/dashboard/api/keys")
    .set("Cookie", cookies)
    .send({ label: "usage-key" });

  return { cookies, apiKey: key.body.apiKey };
}

describe("Usage analytics", () => {
  beforeAll(async () => {
    if (redis.status !== "ready") {
      await redis.connect();
    }
  });

  beforeEach(async () => {
    await resetTestData();
  });

  test(
    "tracks authenticated API usage and serves dashboard analytics",
    async () => {
      const { cookies, apiKey } = await setupUserAndKey();

      const list = await request(app)
        .get("/api/v1/payments")
        .set("Authorization", `Bearer ${apiKey}`);
      expect(list.status).toBe(200);

      const summary = await request(app)
        .get("/dashboard/api/usage/summary")
        .set("Cookie", cookies);
      expect(summary.status).toBe(200);
      expect(summary.body.summary.totalRequests).toBeGreaterThanOrEqual(1);

      const recent = await request(app)
        .get("/dashboard/api/usage/recent")
        .set("Cookie", cookies);
      expect(recent.status).toBe(200);
      expect(Array.isArray(recent.body.events)).toBe(true);
      expect(recent.body.events.length).toBeGreaterThanOrEqual(1);

      const byKey = await request(app)
        .get("/dashboard/api/usage/by-key")
        .set("Cookie", cookies);
      expect(byKey.status).toBe(200);
      expect(Array.isArray(byKey.body.usageByKey)).toBe(true);
    },
    20000,
  );
});
