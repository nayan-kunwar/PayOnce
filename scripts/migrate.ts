import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5433/payonce";

async function migrate() {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const migrationPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../drizzle/migrations/0000_init.sql",
  );
  const sql = readFileSync(migrationPath, "utf8");

  try {
    await pool.query(sql);
    console.log("Database migration completed successfully");
  } finally {
    await pool.end();
  }
}

void migrate();
