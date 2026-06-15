import type { Payment } from "../types/payment.js";

class MemoryDB {
  payments = new Map<string, Payment>();
  idempotencyRecords = new Map<string, unknown>();
}

export const memoryDb = new MemoryDB();
