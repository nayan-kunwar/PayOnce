import { z } from "zod";

import { PAYMENT_STATUSES } from "../types/payment.js";

export const createPaymentSchema = z.object({
  amount: z
    .number({ error: "amount must be a number" })
    .int("amount must be an integer")
    .positive("amount must be greater than zero"),
  customerId: z
    .string({ error: "customerId must be a string" })
    .trim()
    .min(1, "customerId is required"),
});

export const updatePaymentStatusSchema = z.object({
  status: z.enum(PAYMENT_STATUSES),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
