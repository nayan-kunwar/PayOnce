CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "name" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_login_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "user_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_sessions_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "user_sessions"
      ADD CONSTRAINT "user_sessions_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id");
  END IF;
END
$$;

ALTER TABLE "api_keys"
  ADD COLUMN IF NOT EXISTS "user_id" text;

ALTER TABLE "api_keys"
  ALTER COLUMN "owner_email" DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'api_keys_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "api_keys"
      ADD CONSTRAINT "api_keys_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id");
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "api_usage_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text,
  "api_key_id" text,
  "method" text NOT NULL,
  "path" text NOT NULL,
  "status_code" integer NOT NULL,
  "latency_ms" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'api_usage_events_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "api_usage_events"
      ADD CONSTRAINT "api_usage_events_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id");
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'api_usage_events_api_key_id_api_keys_id_fk'
  ) THEN
    ALTER TABLE "api_usage_events"
      ADD CONSTRAINT "api_usage_events_api_key_id_api_keys_id_fk"
      FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id");
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "user_sessions_user_id_idx"
  ON "user_sessions" ("user_id");

CREATE INDEX IF NOT EXISTS "api_keys_user_id_idx"
  ON "api_keys" ("user_id");

CREATE INDEX IF NOT EXISTS "api_usage_events_user_id_idx"
  ON "api_usage_events" ("user_id");

CREATE INDEX IF NOT EXISTS "api_usage_events_api_key_id_idx"
  ON "api_usage_events" ("api_key_id");
