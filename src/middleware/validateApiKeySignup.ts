import type { NextFunction, Request, Response } from "express";

import { ValidationError } from "../errors/AppError.js";
import { createApiKeySchema } from "../validators/apiKey.schema.js";

export function validateApiKeySignup(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const result = createApiKeySchema.safeParse(req.body);

  if (!result.success) {
    return next(
      new ValidationError("Invalid API key signup request", result.error.flatten()),
    );
  }

  req.validatedApiKeySignupBody = result.data;
  next();
}

declare global {
  namespace Express {
    interface Request {
      validatedApiKeySignupBody?: {
        email: string;
        label?: string;
      };
    }
  }
}

export {};
