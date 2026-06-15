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

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const apiKeys = pgTable("api_keys", {
  id: text("id").primaryKey(),
  keyHash: text("key_hash").notNull().unique(),
  keyPrefix: text("key_prefix").notNull(),
  ownerEmail: text("owner_email"),
  userId: text("user_id").references(() => users.id),
  label: text("label"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const userSessions = pgTable("user_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const apiUsageEvents = pgTable("api_usage_events", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  apiKeyId: text("api_key_id").references(() => apiKeys.id),
  method: text("method").notNull(),
  path: text("path").notNull(),
  statusCode: integer("status_code").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PaymentRow = typeof payments.$inferSelect;
export type IdempotencyRecordRow = typeof idempotencyRecords.$inferSelect;
export type ApiKeyRow = typeof apiKeys.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type UserSessionRow = typeof userSessions.$inferSelect;
export type ApiUsageEventRow = typeof apiUsageEvents.$inferSelect;
