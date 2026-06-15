import type { IdempotencyRecord, IdempotencyScope } from "../../types/idempotency.js";
import type { Payment } from "../../types/payment.js";

export interface CreateIdempotencyRecordInput {
  scope: IdempotencyScope;
  requestHash: string;
  payment: Payment;
  expiresAt: Date;
}

export interface IIdempotencyRepository {
  findByScope(scope: IdempotencyScope): Promise<IdempotencyRecord | null>;
  save(input: CreateIdempotencyRecordInput): Promise<IdempotencyRecord>;
}

export interface CachedIdempotencyValue {
  payment: Payment;
  requestHash: string;
}

export interface IIdempotencyCache {
  get(scope: IdempotencyScope): Promise<CachedIdempotencyValue | null>;
  set(
    scope: IdempotencyScope,
    value: CachedIdempotencyValue,
    ttlSeconds: number,
  ): Promise<void>;
}
