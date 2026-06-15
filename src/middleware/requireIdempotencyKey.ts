import type { NextFunction, Request, Response } from "express";

import { ValidationError } from "../errors/AppError.js";

const MAX_IDEMPOTENCY_KEY_LENGTH = 255;

export function requireIdempotencyKey(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const idempotencyKey = req.header("idempotency-key")?.trim();

  if (!idempotencyKey) {
    return next(new ValidationError("Idempotency-Key header is required"));
  }

  if (idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
    return next(
      new ValidationError(
        `Idempotency-Key must be at most ${MAX_IDEMPOTENCY_KEY_LENGTH} characters`,
      ),
    );
  }

  req.idempotencyKey = idempotencyKey;
  next();
}

declare global {
  namespace Express {
    interface Request {
      idempotencyKey?: string;
    }
  }
}

export {};
