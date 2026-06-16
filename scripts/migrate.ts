import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { resolvePgConnectionString } from "../src/db/pgConnection.js";

const databaseUrl = resolvePgConnectionString(
  process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5433/payonce",
);

async function migrate() {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const migrationsDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../drizzle/migrations",
  );
  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  try {
    for (const migrationFile of migrationFiles) {
      const migrationPath = path.join(migrationsDir, migrationFile);
      const sql = readFileSync(migrationPath, "utf8");
      await pool.query(sql);
    }
    console.log("Database migration completed successfully");
  } finally {
    await pool.end();
  }
}

void migrate();
