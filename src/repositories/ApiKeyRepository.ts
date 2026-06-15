import { and, eq, isNull } from "drizzle-orm";

import { db } from "../db/postgres.js";
import { apiKeys, type ApiKeyRow } from "../db/schema.js";
import type {
  CreateApiKeyRecord,
  IApiKeyRepository,
} from "./interfaces/IApiKeyRepository.js";

class PostgresApiKeyRepository implements IApiKeyRepository {
  async save(data: CreateApiKeyRecord): Promise<ApiKeyRow> {
    const [row] = await db
      .insert(apiKeys)
      .values({
        id: data.id,
        keyHash: data.keyHash,
        keyPrefix: data.keyPrefix,
        ownerEmail: data.ownerEmail,
        userId: data.userId,
        label: data.label,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to save API key");
    }

    return row;
  }

  async findActiveByHash(keyHash: string): Promise<ApiKeyRow | null> {
    const [row] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
      .limit(1);

    return row ?? null;
  }

  async markUsed(id: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, id));
  }

  async findByUserId(userId: string): Promise<ApiKeyRow[]> {
    return db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId));
  }

  async revokeByIdAndUserId(id: string, userId: string): Promise<boolean> {
    const [row] = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(apiKeys.id, id),
          eq(apiKeys.userId, userId),
          isNull(apiKeys.revokedAt),
        ),
      )
      .returning({ id: apiKeys.id });

    return Boolean(row);
  }
}

export const apiKeyRepository: IApiKeyRepository =
  new PostgresApiKeyRepository();
