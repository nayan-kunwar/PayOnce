import { createHash } from "node:crypto";

import type { CreatePaymentDTO } from "../types/payment.js";

export function hashRequestBody(data: CreatePaymentDTO): string {
  const normalized = JSON.stringify({
    amount: data.amount,
    customerId: data.customerId,
  });

  return createHash("sha256").update(normalized).digest("hex");
}
