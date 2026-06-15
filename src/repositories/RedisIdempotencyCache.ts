import {
  buildIdempotencyCacheKey,
  redis,
} from "../db/redis.js";
import type {
  CachedIdempotencyValue,
  IIdempotencyCache,
} from "./interfaces/IIdempotencyRepository.js";
import type { IdempotencyScope } from "../types/idempotency.js";
import type { PaymentStatus } from "../types/payment.js";

class RedisIdempotencyCache implements IIdempotencyCache {
  async get(scope: IdempotencyScope): Promise<CachedIdempotencyValue | null> {
    const cached = await redis.get(
      buildIdempotencyCacheKey(scope.customerId, scope.idempotencyKey),
    );

    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached) as CachedIdempotencyValue & {
      payment: {
        createdAt: string;
        updatedAt: string;
        status: PaymentStatus;
      };
    };

    return {
      requestHash: parsed.requestHash,
      payment: {
        ...parsed.payment,
        createdAt: new Date(parsed.payment.createdAt),
        updatedAt: new Date(parsed.payment.updatedAt),
      },
    };
  }

  async set(
    scope: IdempotencyScope,
    value: CachedIdempotencyValue,
    ttlSeconds: number,
  ): Promise<void> {
    await redis.set(
      buildIdempotencyCacheKey(scope.customerId, scope.idempotencyKey),
      JSON.stringify(value),
      "EX",
      ttlSeconds,
    );
  }
}

export const idempotencyCache: IIdempotencyCache = new RedisIdempotencyCache();
