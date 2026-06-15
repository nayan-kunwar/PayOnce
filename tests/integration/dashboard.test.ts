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

async function signupAndGetCookies() {
  const signup = await request(app).post("/auth/signup").send({
    email: "dash@example.com",
    password: "supersecret3",
  });
  return requireCookies(signup.headers["set-cookie"]);
}

describe("Dashboard API", () => {
  beforeAll(async () => {
    if (redis.status !== "ready") {
      await redis.connect();
    }
  });

  beforeEach(async () => {
    await resetTestData();
  });

  test(
    "create/list/revoke personal keys",
    async () => {
      const cookies = await signupAndGetCookies();

      const created = await request(app)
        .post("/dashboard/api/keys")
        .set("Cookie", cookies)
        .send({ label: "primary" });
      expect(created.status).toBe(201);
      expect(created.body.apiKey.startsWith("pk_live_")).toBe(true);

      const listed = await request(app)
        .get("/dashboard/api/keys")
        .set("Cookie", cookies);
      expect(listed.status).toBe(200);
      expect(listed.body.keys).toHaveLength(1);
      const keyId = listed.body.keys[0].id;

      const revoked = await request(app)
        .delete(`/dashboard/api/keys/${keyId}`)
        .set("Cookie", cookies);
      expect(revoked.status).toBe(200);

      const failsAfterRevoke = await request(app)
        .get("/api/v1/payments")
        .set("Authorization", `Bearer ${created.body.apiKey}`);
      expect(failsAfterRevoke.status).toBe(401);
    },
    20000,
  );
});
