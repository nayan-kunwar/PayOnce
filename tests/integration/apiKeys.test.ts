import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import request from "supertest";

import app from "../../src/app.js";
import { redis } from "../../src/db/redis.js";
import { resetTestData, testApiKey } from "../helpers/testUtils.js";

describe("API key authentication", () => {
  beforeAll(async () => {
    if (redis.status !== "ready") {
      await redis.connect();
    }
  });

  beforeEach(async () => {
    await resetTestData();
  });

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
