import { eq } from "drizzle-orm";

import { db } from "../db/postgres.js";
import { payments } from "../db/schema.js";
import type { Payment, PaymentStatus } from "../types/payment.js";
import type { IPaymentRepository } from "./interfaces/IPaymentRepository.js";

function mapRow(row: typeof payments.$inferSelect): Payment {
  return {
    id: row.id,
    amount: row.amount,
    customerId: row.customerId,
    status: row.status as PaymentStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

class PostgresPaymentRepository implements IPaymentRepository {
  async save(payment: Payment): Promise<Payment> {
    const [row] = await db
      .insert(payments)
      .values({
        id: payment.id,
        customerId: payment.customerId,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to save payment");
    }

    return mapRow(row);
  }

  async findById(id: string): Promise<Payment | null> {
    const [row] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);

    return row ? mapRow(row) : null;
  }

  async findAll(): Promise<Payment[]> {
    const rows = await db.select().from(payments);
    return rows.map(mapRow);
  }

  async updateStatus(
    id: string,
    status: PaymentStatus,
  ): Promise<Payment | null> {
    const [row] = await db
      .update(payments)
      .set({ status, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();

    return row ? mapRow(row) : null;
  }
}

export const paymentRepository: IPaymentRepository =
  new PostgresPaymentRepository();
