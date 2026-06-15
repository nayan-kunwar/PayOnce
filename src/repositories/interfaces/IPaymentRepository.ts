import type { Payment, PaymentStatus } from "../../types/payment.js";

export interface IPaymentRepository {
  save(payment: Payment): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findAll(): Promise<Payment[]>;
  updateStatus(id: string, status: PaymentStatus): Promise<Payment | null>;
}
