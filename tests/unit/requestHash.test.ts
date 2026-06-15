import { describe, expect, test } from "bun:test";

import { hashRequestBody } from "../../src/utils/requestHash.js";

describe("hashRequestBody", () => {
  test("returns stable hash for same payload", () => {
    const payload = { amount: 1000, customerId: "cust_1" };
    expect(hashRequestBody(payload)).toBe(hashRequestBody(payload));
  });

  test("returns different hash for different payloads", () => {
    const first = hashRequestBody({ amount: 1000, customerId: "cust_1" });
    const second = hashRequestBody({ amount: 2000, customerId: "cust_1" });

    expect(first).not.toBe(second);
  });
});
