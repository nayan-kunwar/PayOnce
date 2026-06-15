import { z } from "zod";

export const signupSchema = z.object({
  email: z
    .string({ error: "email must be a string" })
    .trim()
    .toLowerCase()
    .email("email must be a valid email address"),
  password: z
    .string({ error: "password must be a string" })
    .min(8, "password must be at least 8 characters"),
  name: z
    .string({ error: "name must be a string" })
    .trim()
    .max(80, "name must be at most 80 characters")
    .optional(),
});

export const loginSchema = z.object({
  email: z
    .string({ error: "email must be a string" })
    .trim()
    .toLowerCase()
    .email("email must be a valid email address"),
  password: z.string({ error: "password must be a string" }).min(1),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
