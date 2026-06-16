import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { env } from "../config/env.js";
import { resolvePgConnectionString } from "./pgConnection.js";
import * as schema from "./schema.js";

const pool = new pg.Pool({
  connectionString: resolvePgConnectionString(env.DATABASE_URL),
});

export const db = drizzle(pool, { schema });

export async function checkPostgresConnection(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

export async function closePostgresConnection(): Promise<void> {
  await pool.end();
}

export { pool };
