import { randomUUID } from "node:crypto";

export function generatePaymentId(): string {
  return `pay_${randomUUID()}`;
}
