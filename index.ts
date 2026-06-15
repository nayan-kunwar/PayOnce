import type { Server } from "node:http";

import app from "./src/app.js";
import { env } from "./src/config/env.js";
import { closePostgresConnection } from "./src/db/postgres.js";
import { closeRedisConnection, redis } from "./src/db/redis.js";

const PORT = env.PORT;

let server: Server | undefined;

async function startServer() {
  await redis.connect();

  server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down gracefully...`);

  const closeServer = new Promise<void>((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }

    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  try {
    await closeServer;
    await closeRedisConnection();
    await closePostgresConnection();
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown", error);
    process.exit(1);
  }
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

void startServer();

export default app;
