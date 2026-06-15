CREATE TABLE IF NOT EXISTS "payments" (
  "id" text PRIMARY KEY NOT NULL,
  "customer_id" text NOT NULL,
  "amount" integer NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "payments_amount_check" CHECK ("amount" > 0)
);

CREATE TABLE IF NOT EXISTS "idempotency_records" (
  "id" serial PRIMARY KEY NOT NULL,
  "customer_id" text NOT NULL,
  "idempotency_key" text NOT NULL,
  "request_hash" text NOT NULL,
  "payment_id" text NOT NULL,
  "response_json" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  CONSTRAINT "idempotency_records_payment_id_payments_id_fk"
    FOREIGN KEY ("payment_id") REFERENCES "payments"("id"),
  CONSTRAINT "idempotency_records_customer_id_idempotency_key_unique"
    UNIQUE("customer_id", "idempotency_key")
);
