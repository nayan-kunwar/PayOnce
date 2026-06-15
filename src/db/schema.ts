import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const idempotencyRecords = pgTable(
  "idempotency_records",
  {
    id: serial("id").primaryKey(),
    customerId: text("customer_id").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    requestHash: text("request_hash").notNull(),
    paymentId: text("payment_id")
      .notNull()
      .references(() => payments.id),
    responseJson: jsonb("response_json").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [unique().on(table.customerId, table.idempotencyKey)],
);

export type PaymentRow = typeof payments.$inferSelect;
export type IdempotencyRecordRow = typeof idempotencyRecords.$inferSelect;
