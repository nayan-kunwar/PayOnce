import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import request from "supertest";

import app from "../../src/app.js";
import { redis } from "../../src/db/redis.js";
import { resetTestData, testApiKey } from "../helpers/testUtils.js";

const authHeader = {  Authorization: `Bearer ${testApiKey}`,
};

describe("Demo API proxy", () => {
  beforeAll(async () => {
    if (redis.status !== "ready") {
      await redis.connect();
    }
  });

  beforeEach(async () => {
    await resetTestData();
  });

  test(
    "allows payment operations without an API key",
    async () => {
    const created = await request(app)
      .post("/demo/api/payments")
      .set("Idempotency-Key", "demo-key-001")
      .send({ amount: 1500, customerId: "demo_cust" });

    expect(created.status).toBe(201);
    expect(created.body.success).toBe(true);
    expect(created.body.payment.amount).toBe(1500);

    const duplicate = await request(app)
      .post("/demo/api/payments")
      .set("Idempotency-Key", "demo-key-001")
      .send({ amount: 1500, customerId: "demo_cust" });

    expect(duplicate.status).toBe(201);
    expect(duplicate.body.fromCache).toBe(true);

    const list = await request(app).get("/demo/api/payments");
    expect(list.status).toBe(200);
    expect(list.body.payments).toHaveLength(1);

    const updated = await request(app)
      .patch(`/demo/api/payments/${created.body.payment.id}/status`)
      .send({ status: "completed" });

    expect(updated.status).toBe(200);
    expect(updated.body.payment.status).toBe("completed");
  },
    15000,
  );

  test("still requires API key on /api/v1 routes", async () => {
    const response = await request(app)
      .post("/api/v1/payments")
      .set("Idempotency-Key", "protected-key")
      .send({ amount: 1000, customerId: "cust_1" });

    expect(response.status).toBe(401);
  });

  test(
    "accepts authenticated /api/v1 requests alongside demo routes",
    async () => {
    const demo = await request(app)
      .post("/demo/api/payments")
      .set("Idempotency-Key", "demo-only")
      .send({ amount: 500, customerId: "demo" });

    const api = await request(app)
      .post("/api/v1/payments")
      .set(authHeader)
      .set("Idempotency-Key", "api-only")
      .send({ amount: 500, customerId: "api" });

    expect(demo.status).toBe(201);
    expect(api.status).toBe(201);

    const list = await request(app).get("/demo/api/payments");
    expect(list.body.payments).toHaveLength(2);
  },
    15000,
  );
});
