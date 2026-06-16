import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  API_KEYS: z
    .string()
    .default("dev-api-key")
    .transform((value) =>
      value
        .split(",")
        .map((key) => key.trim())
        .filter(Boolean),
    ),
  IDEMPOTENCY_TTL_SECONDS: z.coerce.number().default(86400),
  DEMO_ENABLED: z
    .string()
    .optional()
    .default("true")
    .transform((value) => value !== "false" && value !== "0"),
  SESSION_COOKIE_NAME: z.string().default("payonce_session"),
  SESSION_TTL_HOURS: z.coerce.number().default(168),
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean)
        : [],
    ),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
