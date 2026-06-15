import { z } from "zod";

export const createApiKeySchema = z.object({
  email: z
    .string({ error: "email must be a string" })
    .trim()
    .toLowerCase()
    .email("email must be a valid email address"),
  label: z
    .string({ error: "label must be a string" })
    .trim()
    .max(80, "label must be at most 80 characters")
    .optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
