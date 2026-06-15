import { and, eq, gt, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "../db/postgres.js";
import { userSessions, type UserSessionRow } from "../db/schema.js";

type CreateSessionRecord = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

class SessionRepository {
  async create(data: CreateSessionRecord): Promise<UserSessionRow> {
    const [row] = await db
      .insert(userSessions)
      .values({
        id: `ses_${randomUUID()}`,
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to create session");
    }

    return row;
  }

  async findActiveByTokenHash(tokenHash: string): Promise<UserSessionRow | null> {
    const [row] = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.tokenHash, tokenHash),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    await db
      .update(userSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(userSessions.tokenHash, tokenHash), isNull(userSessions.revokedAt)));
  }
}

export const sessionRepository = new SessionRepository();
