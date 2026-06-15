import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import request from "supertest";

import app from "../../src/app.js";
import { redis } from "../../src/db/redis.js";
import { resetTestData, testApiKey } from "../helpers/testUtils.js";

const authHeader = {
  Authorization: `Bearer ${testApiKey}`,
};

describe("PayOnce integration", () => {
  beforeAll(async () => {
    if (redis.status !== "ready") {
      await redis.connect();
    }
  });

  beforeEach(async () => {
    await resetTestData();
  });

  afterAll(async () => {
    await redis.quit();
  });

  test("rejects requests without API key", async () => {
    const response = await request(app)
      .post("/api/v1/payments")
      .set("Idempotency-Key", "missing-auth-key")
      .send({ amount: 1000, customerId: "cust_1" });

    expect(response.status).toBe(401);
  });

  test("creates payment and returns cached response for duplicate key", async () => {
    const first = await request(app)
      .post("/api/v1/payments")
      .set(authHeader)
      .set("Idempotency-Key", "key-001")
      .send({ amount: 1500, customerId: "cust_a" });

    const second = await request(app)
      .post("/api/v1/payments")
      .set(authHeader)
      .set("Idempotency-Key", "key-001")
      .send({ amount: 1500, customerId: "cust_a" });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.fromCache).toBe(false);
    expect(second.body.fromCache).toBe(true);
    expect(first.body.payment.id).toBe(second.body.payment.id);
  });

  test("allows same idempotency key for different customers", async () => {
    const customerA = await request(app)
      .post("/api/v1/payments")
      .set(authHeader)
      .set("Idempotency-Key", "shared-key")
      .send({ amount: 1000, customerId: "cust_a" });

    const customerB = await request(app)
      .post("/api/v1/payments")
      .set(authHeader)
      .set("Idempotency-Key", "shared-key")
      .send({ amount: 1000, customerId: "cust_b" });

    expect(customerA.status).toBe(201);
    expect(customerB.status).toBe(201);
    expect(customerA.body.payment.id).not.toBe(customerB.body.payment.id);
  });

  test("returns 409 when idempotency key is reused with different body", async () => {
    await request(app)
      .post("/api/v1/payments")
      .set(authHeader)
      .set("Idempotency-Key", "conflict-key")
      .send({ amount: 1000, customerId: "cust_conflict" });

    const conflict = await request(app)
      .post("/api/v1/payments")
      .set(authHeader)
      .set("Idempotency-Key", "conflict-key")
      .send({ amount: 2000, customerId: "cust_conflict" });

    expect(conflict.status).toBe(409);
  });

  test("handles concurrent duplicate requests with one payment created", async () => {
    const payload = { amount: 5000, customerId: "cust_concurrent" };
    const responses = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(app)
          .post("/api/v1/payments")
          .set(authHeader)
          .set("Idempotency-Key", "concurrent-key")
          .send(payload),
      ),
    );

    for (const response of responses) {
      expect(response.status).toBe(201);
    }

    const paymentIds = new Set(
      responses.map((response) => response.body.payment.id),
    );
    expect(paymentIds.size).toBe(1);

    const list = await request(app).get("/api/v1/payments").set(authHeader);
    expect(list.body.payments).toHaveLength(1);
  });

  test("updates payment status with valid transition", async () => {
    const created = await request(app)
      .post("/api/v1/payments")
      .set(authHeader)
      .set("Idempotency-Key", "status-key")
      .send({ amount: 1200, customerId: "cust_status" });

    const updated = await request(app)
      .patch(`/api/v1/payments/${created.body.payment.id}/status`)
      .set(authHeader)
      .send({ status: "completed" });

    expect(updated.status).toBe(200);
    expect(updated.body.payment.status).toBe("completed");
  });

  test("health and ready endpoints respond", async () => {
    const health = await request(app).get("/health");
    const ready = await request(app).get("/ready");

    expect(health.status).toBe(200);
    expect(ready.status).toBe(200);
  });
});
