import { describe, expect, test } from "bun:test";

import { resetTestData } from "../helpers/testUtils.js";
import {
  resolveTestDatabaseUrl,
  resolveTestRedisUrl,
} from "../testEnv.js";

describe("test environment resolution", () => {
  test("replaces neon database url with local docker default", () => {
    expect(
      resolveTestDatabaseUrl(
        "postgresql://user:pass@ep-frosty-bird.neon.tech/neondb",
      ),
    ).toBe("postgresql://postgres:postgres@localhost:5433/payonce");
  });

  test("keeps local ci database url on port 5432", () => {
    expect(
      resolveTestDatabaseUrl(
        "postgresql://postgres:postgres@localhost:5432/payonce",
      ),
    ).toBe("postgresql://postgres:postgres@localhost:5432/payonce");
  });

  test("replaces upstash redis url with local default", () => {
    expect(
      resolveTestRedisUrl("rediss://default:token@advanced.upstash.io:6379"),
    ).toBe("redis://localhost:6379");
  });

  test("keeps local redis url", () => {
    expect(resolveTestRedisUrl("redis://localhost:6379")).toBe(
      "redis://localhost:6379",
    );
  });
});

describe("resetTestData safety guard", () => {
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
