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

describe("Auth flows", () => {
  beforeAll(async () => {
    if (redis.status !== "ready") {
      await redis.connect();
    }
  });

  beforeEach(async () => {
    await resetTestData();
  });

  test(
    "signup and me endpoint with session cookie",
    async () => {
      const signup = await request(app).post("/auth/signup").send({
        email: "user@example.com",
        password: "supersecret1",
        name: "User One",
      });

      expect(signup.status).toBe(201);
      const signupCookies = requireCookies(signup.headers["set-cookie"]);

      const me = await request(app)
        .get("/auth/me")
        .set("Cookie", signupCookies);

      expect(me.status).toBe(200);
      expect(me.body.user.email).toBe("user@example.com");
    },
    15000,
  );

  test(
    "login and logout flow",
    async () => {
      await request(app).post("/auth/signup").send({
        email: "user2@example.com",
        password: "supersecret2",
      });

      const login = await request(app).post("/auth/login").send({
        email: "user2@example.com",
        password: "supersecret2",
      });

      expect(login.status).toBe(200);
      const cookies = requireCookies(login.headers["set-cookie"]);

      const meBeforeLogout = await request(app).get("/auth/me").set("Cookie", cookies);
      expect(meBeforeLogout.status).toBe(200);

      const logout = await request(app)
        .post("/auth/logout")
        .set("Cookie", cookies);
      expect(logout.status).toBe(200);

      const meAfterLogout = await request(app)
        .get("/auth/me")
        .set("Cookie", cookies);
      expect(meAfterLogout.status).toBe(401);
    },
    15000,
  );
});
