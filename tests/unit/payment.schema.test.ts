import { describe, expect, test } from "bun:test";

import { createPaymentSchema } from "../../src/validators/payment.schema.js";

describe("createPaymentSchema", () => {
  test("accepts valid payload", () => {
    const result = createPaymentSchema.safeParse({
      amount: 1000,
      customerId: "cust_123",
    });

    expect(result.success).toBe(true);
  });

  test("rejects non-positive amount", () => {
    const result = createPaymentSchema.safeParse({
      amount: 0,
      customerId: "cust_123",
    });

    expect(result.success).toBe(false);
  });

  test("rejects empty customerId", () => {
    const result = createPaymentSchema.safeParse({
      amount: 1000,
      customerId: "   ",
    });

    expect(result.success).toBe(false);
  });
});
