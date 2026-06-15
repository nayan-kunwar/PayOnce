import { db } from "../postgres.js";
import { idempotencyRecords, payments } from "../schema.js";
import type { IdempotencyScope } from "../../types/idempotency.js";
import type { Payment } from "../../types/payment.js";

export async function createPaymentTransaction(input: {
  payment: Payment;
  scope: IdempotencyScope;
  requestHash: string;
  expiresAt: Date;
}): Promise<Payment> {
  await db.transaction(async (tx) => {
    await tx.insert(payments).values({
      id: input.payment.id,
      customerId: input.payment.customerId,
      amount: input.payment.amount,
      status: input.payment.status,
      createdAt: input.payment.createdAt,
      updatedAt: input.payment.updatedAt,
    });

    await tx.insert(idempotencyRecords).values({
      customerId: input.scope.customerId,
      idempotencyKey: input.scope.idempotencyKey,
      requestHash: input.requestHash,
      paymentId: input.payment.id,
      responseJson: input.payment,
      expiresAt: input.expiresAt,
    });
  });

  return input.payment;
}
