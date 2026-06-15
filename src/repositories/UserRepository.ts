import { eq } from "drizzle-orm";

import { randomUUID } from "node:crypto";
import { db } from "../db/postgres.js";
import { users, type UserRow } from "../db/schema.js";

export type CreateUserRecord = {
  email: string;
  passwordHash: string;
  name?: string;
};

class UserRepository {
  async create(data: CreateUserRecord): Promise<UserRow> {
    const [row] = await db
      .insert(users)
      .values({
        id: `usr_${randomUUID()}`,
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to create user");
    }

    return row;
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return row ?? null;
  }

  async findById(id: string): Promise<UserRow | null> {
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return row ?? null;
  }

  async markLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }
}

export const userRepository = new UserRepository();
