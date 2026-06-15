import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import request from "supertest";

import app from "../../src/app.js";
import { redis } from "../../src/db/redis.js";
import { resetTestData, testApiKey } from "../helpers/testUtils.js";

describe("API key signup", () => {
  beforeAll(async () => {
    if (redis.status !== "ready") {
      await redis.connect();
    }
  });

  beforeEach(async () => {
    await resetTestData();
  });

  test(
    "creates a key and uses it on /api/v1 routes",
    async () => {
      const signup = await request(app).post("/api/keys").send({
        email: "dev@example.com",
        label: "My Test App",
      });

      expect(signup.status).toBe(201);
      expect(signup.body.success).toBe(true);
      expect(typeof signup.body.apiKey).toBe("string");
      expect(signup.body.apiKey.startsWith("pk_live_")).toBe(true);
      expect(typeof signup.body.keyPrefix).toBe("string");
      expect(signup.body.message).toContain("Save this key now");

      const list = await request(app)
        .get("/api/v1/payments")
        .set("Authorization", `Bearer ${signup.body.apiKey}`);

      expect(list.status).toBe(200);
      expect(Array.isArray(list.body.payments)).toBe(true);
    },
    15000,
  );

  test("rejects invalid DB api key", async () => {
    const response = await request(app)
      .get("/api/v1/payments")
      .set("Authorization", "Bearer pk_live_invalid_key");

    expect(response.status).toBe(401);
  });

  test("keeps static env API_KEYS working", async () => {
    const response = await request(app)
      .get("/api/v1/payments")
      .set("Authorization", `Bearer ${testApiKey}`);

    expect(response.status).toBe(200);
  });
});
