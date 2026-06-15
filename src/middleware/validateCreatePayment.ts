import type { NextFunction, Request, Response } from "express";

import { ValidationError } from "../errors/AppError.js";
import { createPaymentSchema } from "../validators/payment.schema.js";

export function validateCreatePayment(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const result = createPaymentSchema.safeParse(req.body);

  if (!result.success) {
    return next(
      new ValidationError("Invalid payment request body", result.error.flatten()),
    );
  }

  req.validatedBody = result.data;
  next();
}

declare global {
  namespace Express {
    interface Request {
      validatedBody?: {
        amount: number;
        customerId: string;
      };
    }
  }
}

export {};
