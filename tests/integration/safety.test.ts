import { describe, expect, test } from "bun:test";

import { resetTestData } from "../helpers/testUtils.js";

describe("resetTestData safety guard", () => {
  test("setup forces local docker urls even when .env uses cloud", () => {
    expect(process.env.DATABASE_URL).toContain("localhost:5433");
    expect(process.env.DATABASE_URL).not.toContain("neon.tech");
    expect(process.env.REDIS_URL).toBe("redis://localhost:6379");
  });

  test("refuses to truncate a Neon database URL", async () => {
    const originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL =
      "postgresql://user:pass@ep-frosty-bird.neon.tech/neondb";

    await expect(resetTestData()).rejects.toThrow(/Refusing to truncate remote/);

    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  test("refuses to flush Upstash Redis", async () => {
    const originalRedisUrl = process.env.REDIS_URL;
    process.env.REDIS_URL = "rediss://default:token@advanced.upstash.io:6379";

    await expect(resetTestData()).rejects.toThrow(/Refusing to flush remote/);

    process.env.REDIS_URL = originalRedisUrl;
  });
});
