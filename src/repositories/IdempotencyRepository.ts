import { and, eq } from "drizzle-orm";

import { db } from "../db/postgres.js";
import { idempotencyRecords } from "../db/schema.js";
import type {
  CreateIdempotencyRecordInput,
  IIdempotencyRepository,
} from "./interfaces/IIdempotencyRepository.js";
import type { IdempotencyRecord } from "../types/idempotency.js";
import type { Payment, PaymentStatus } from "../types/payment.js";

function mapPaymentResponse(value: unknown): Payment {
  const record = value as Record<string, unknown>;

  return {
    id: String(record.id),
    amount: Number(record.amount),
    customerId: String(record.customerId),
    status: record.status as PaymentStatus,
    createdAt: new Date(String(record.createdAt)),
    updatedAt: new Date(String(record.updatedAt)),
  };
}

function mapRow(row: typeof idempotencyRecords.$inferSelect): IdempotencyRecord {
  return {
    key: row.idempotencyKey,
    customerId: row.customerId,
    requestHash: row.requestHash,
    response: mapPaymentResponse(row.responseJson),
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  };
}

class PostgresIdempotencyRepository implements IIdempotencyRepository {
  async findByScope(scope: {
    customerId: string;
    idempotencyKey: string;
  }): Promise<IdempotencyRecord | null> {
    const [row] = await db
      .select()
      .from(idempotencyRecords)
      .where(
        and(
          eq(idempotencyRecords.customerId, scope.customerId),
          eq(idempotencyRecords.idempotencyKey, scope.idempotencyKey),
        ),
      )
      .limit(1);

    return row ? mapRow(row) : null;
  }

  async save(input: CreateIdempotencyRecordInput): Promise<IdempotencyRecord> {
    const [row] = await db
      .insert(idempotencyRecords)
      .values({
        customerId: input.scope.customerId,
        idempotencyKey: input.scope.idempotencyKey,
        requestHash: input.requestHash,
        paymentId: input.payment.id,
        responseJson: input.payment,
        expiresAt: input.expiresAt,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to save idempotency record");
    }

    return mapRow(row);
  }
}

export const idempotencyRepository: IIdempotencyRepository =
  new PostgresIdempotencyRepository();

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
