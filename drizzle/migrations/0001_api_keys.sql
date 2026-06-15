CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" text PRIMARY KEY NOT NULL,
  "key_hash" text NOT NULL UNIQUE,
  "key_prefix" text NOT NULL,
  "owner_email" text NOT NULL,
  "label" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_used_at" timestamp with time zone,
  "revoked_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "api_keys_owner_email_idx"
  ON "api_keys" ("owner_email");
