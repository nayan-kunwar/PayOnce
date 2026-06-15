import type { NextFunction, Request, Response } from "express";

import { ValidationError } from "../errors/AppError.js";
import { loginSchema, signupSchema } from "../validators/auth.schema.js";

export function validateSignup(req: Request, _res: Response, next: NextFunction) {
  const result = signupSchema.safeParse(req.body);

  if (!result.success) {
    return next(new ValidationError("Invalid signup request", result.error.flatten()));
  }

  req.validatedSignupBody = result.data;
  return next();
}

export function validateLogin(req: Request, _res: Response, next: NextFunction) {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return next(new ValidationError("Invalid login request", result.error.flatten()));
  }

  req.validatedLoginBody = result.data;
  return next();
}

declare global {
  namespace Express {
    interface Request {
      validatedSignupBody?: {
        email: string;
        password: string;
        name?: string;
      };
      validatedLoginBody?: {
        email: string;
        password: string;
      };
      authUser?: {
        id: string;
        email: string;
        name?: string | null;
      };
    }
  }
}

export {};
