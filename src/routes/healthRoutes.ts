import { Router } from "express";

import { checkPostgresConnection } from "../db/postgres.js";
import { checkRedisConnection } from "../db/redis.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
  });
});

router.get("/ready", async (_req, res) => {
  const [postgresReady, redisReady] = await Promise.all([
    checkPostgresConnection(),
    checkRedisConnection(),
  ]);

  if (!postgresReady || !redisReady) {
    return res.status(503).json({
      success: false,
      status: "not_ready",
      checks: {
        postgres: postgresReady,
        redis: redisReady,
      },
    });
  }

  return res.status(200).json({
    success: true,
    status: "ready",
    checks: {
      postgres: true,
      redis: true,
    },
  });
});

export default router;
