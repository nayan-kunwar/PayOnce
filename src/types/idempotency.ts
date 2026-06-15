import type { Payment } from "./payment.js";

export interface IdempotencyRecord {
  key: string;
  customerId: string;
  requestHash: string;
  response: Payment;
  createdAt: Date;
  expiresAt: Date;
}

export interface IdempotencyScope {
  customerId: string;
  idempotencyKey: string;
}
