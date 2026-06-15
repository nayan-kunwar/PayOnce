import { env } from "../config/env.js";
import { redis } from "../db/redis.js";
import { createPaymentTransaction } from "../db/transactions/createPaymentTransaction.js";
import {
  IdempotencyConflictError,
  InvalidStatusTransitionError,
  NotFoundError,
} from "../errors/AppError.js";
import {
  idempotencyRepository,
  isUniqueViolation,
} from "../repositories/IdempotencyRepository.js";
import { idempotencyCache } from "../repositories/RedisIdempotencyCache.js";
import { paymentRepository } from "../repositories/PaymentRepository.js";
import type { CreatePaymentResult } from "../types/api.js";
import type { IdempotencyScope } from "../types/idempotency.js";
import {
  ALLOWED_STATUS_TRANSITIONS,
  type CreatePaymentDTO,
  type Payment,
  type PaymentStatus,
} from "../types/payment.js";
import { generatePaymentId } from "../utils/generatePaymentId.js";
import { hashRequestBody } from "../utils/requestHash.js";

class PaymentService {
  private isRecordExpired(expiresAt: Date): boolean {
    return expiresAt.getTime() <= Date.now();
  }

  private async resolveExistingRecord(
    scope: IdempotencyScope,
    requestHash: string,
  ): Promise<CreatePaymentResult | null> {
    const existingRecord = await idempotencyRepository.findByScope(scope);

    if (!existingRecord || this.isRecordExpired(existingRecord.expiresAt)) {
      return null;
    }

    if (existingRecord.requestHash !== requestHash) {
      throw new IdempotencyConflictError();
    }

    await idempotencyCache.set(
      scope,
      {
        payment: existingRecord.response,
        requestHash: existingRecord.requestHash,
      },
      env.IDEMPOTENCY_TTL_SECONDS,
    );

    return {
      fromCache: true,
      payment: existingRecord.response,
    };
  }

  async createPayment(
    data: CreatePaymentDTO,
    idempotencyKey: string,
  ): Promise<CreatePaymentResult> {
    const scope: IdempotencyScope = {
      customerId: data.customerId,
      idempotencyKey,
    };
    const requestHash = hashRequestBody(data);

    // Initial check (fast, no lock)
    const cachedValue = await idempotencyCache.get(scope);
    if (cachedValue) {
      if (cachedValue.requestHash !== requestHash) {
        throw new IdempotencyConflictError();
      }

      return { fromCache: true, payment: cachedValue.payment };
    }

    // Acquire lock for this customerId + idempotencyKey
    const lockKey = `lock:payment:${scope.customerId}:${scope.idempotencyKey}`;
    let acquired = false;
    const maxRetries = 40;
    const retryDelayMs = 50;

    for (let i = 0; i < maxRetries; i++) {
      const res = await redis.set(lockKey, "locked", "PX", 5000, "NX");
      if (res === "OK") {
        acquired = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }

    try {
      // Re-check cache after acquiring lock
      const doubleCheckCachedValue = await idempotencyCache.get(scope);
      if (doubleCheckCachedValue) {
        if (doubleCheckCachedValue.requestHash !== requestHash) {
          throw new IdempotencyConflictError();
        }

        return { fromCache: true, payment: doubleCheckCachedValue.payment };
      }

      // Re-check database
      const existingResult = await this.resolveExistingRecord(scope, requestHash);
      if (existingResult) {
        return existingResult;
      }

      const now = new Date();
      const payment: Payment = {
        id: generatePaymentId(),
        amount: data.amount,
        customerId: data.customerId,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };

      const expiresAt = new Date(
        Date.now() + env.IDEMPOTENCY_TTL_SECONDS * 1000,
      );

      try {
        await createPaymentTransaction({
          payment,
          scope,
          requestHash,
          expiresAt,
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          const duplicateResult = await this.resolveExistingRecord(
            scope,
            requestHash,
          );

          if (duplicateResult) {
            return duplicateResult;
          }

          throw new IdempotencyConflictError();
        }

        throw error;
      }

      await idempotencyCache.set(
        scope,
        { payment, requestHash },
        env.IDEMPOTENCY_TTL_SECONDS,
      );

      return { fromCache: false, payment };
    } finally {
      if (acquired) {
        await redis.del(lockKey).catch(() => {});
      }
    }
  }

  async getPaymentById(id: string): Promise<Payment> {
    const payment = await paymentRepository.findById(id);

    if (!payment) {
      throw new NotFoundError(`Payment with id '${id}' was not found`);
    }

    return payment;
  }

  async getAllPayments(): Promise<Payment[]> {
    return paymentRepository.findAll();
  }

  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
  ): Promise<Payment> {
    const payment = await paymentRepository.findById(id);

    if (!payment) {
      throw new NotFoundError(`Payment with id '${id}' was not found`);
    }

    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[payment.status as PaymentStatus];

    if (!allowedTransitions.includes(status)) {
      throw new InvalidStatusTransitionError(payment.status, status);
    }

    const updatedPayment = await paymentRepository.updateStatus(id, status);

    if (!updatedPayment) {
      throw new NotFoundError(`Payment with id '${id}' was not found`);
    }

    return updatedPayment;
  }
}

export const paymentService = new PaymentService();
