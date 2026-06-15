import { and, count, desc, eq, sql } from "drizzle-orm";

import { db } from "../db/postgres.js";
import { apiKeys, apiUsageEvents } from "../db/schema.js";

export type CreateUsageEvent = {
  userId?: string | null;
  apiKeyId?: string | null;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
};

class UsageRepository {
  async create(event: CreateUsageEvent): Promise<void> {
    await db.insert(apiUsageEvents).values({
      userId: event.userId ?? null,
      apiKeyId: event.apiKeyId ?? null,
      method: event.method,
      path: event.path,
      statusCode: event.statusCode,
      latencyMs: event.latencyMs,
    });
  }

  async getSummaryByUserId(userId: string) {
    const [row] = await db
      .select({
        totalRequests: count(apiUsageEvents.id),
        successCount: sql<number>`COUNT(CASE WHEN ${apiUsageEvents.statusCode} >= 200 AND ${apiUsageEvents.statusCode} < 400 THEN 1 END)`,
        errorCount: sql<number>`COUNT(CASE WHEN ${apiUsageEvents.statusCode} >= 400 THEN 1 END)`,
        avgLatencyMs: sql<number>`COALESCE(ROUND(AVG(${apiUsageEvents.latencyMs})), 0)`,
      })
      .from(apiUsageEvents)
      .where(eq(apiUsageEvents.userId, userId));

    return {
      totalRequests: Number(row?.totalRequests ?? 0),
      successCount: Number(row?.successCount ?? 0),
      errorCount: Number(row?.errorCount ?? 0),
      avgLatencyMs: Number(row?.avgLatencyMs ?? 0),
    };
  }

  async getRecentByUserId(userId: string, limit = 20) {
    return db
      .select({
        id: apiUsageEvents.id,
        method: apiUsageEvents.method,
        path: apiUsageEvents.path,
        statusCode: apiUsageEvents.statusCode,
        latencyMs: apiUsageEvents.latencyMs,
        createdAt: apiUsageEvents.createdAt,
        apiKeyId: apiUsageEvents.apiKeyId,
      })
      .from(apiUsageEvents)
      .where(eq(apiUsageEvents.userId, userId))
      .orderBy(desc(apiUsageEvents.createdAt))
      .limit(limit);
  }

  async getByKeyForUser(userId: string) {
    return db
      .select({
        apiKeyId: apiUsageEvents.apiKeyId,
        keyPrefix: apiKeys.keyPrefix,
        requestCount: count(apiUsageEvents.id),
      })
      .from(apiUsageEvents)
      .leftJoin(
        apiKeys,
        and(
          eq(apiUsageEvents.apiKeyId, apiKeys.id),
          eq(apiKeys.userId, userId),
        ),
      )
      .where(eq(apiUsageEvents.userId, userId))
      .groupBy(apiUsageEvents.apiKeyId, apiKeys.keyPrefix)
      .orderBy(desc(count(apiUsageEvents.id)));
  }
}

export const usageRepository = new UsageRepository();
