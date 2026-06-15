import type { NextFunction, Request, Response } from "express";

import { ValidationError } from "../errors/AppError.js";
import { updatePaymentStatusSchema } from "../validators/payment.schema.js";

export function validateUpdatePaymentStatus(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const result = updatePaymentStatusSchema.safeParse(req.body);

  if (!result.success) {
    return next(
      new ValidationError(
        "Invalid payment status request body",
        result.error.flatten(),
      ),
    );
  }

  req.validatedStatusBody = result.data;
  next();
}

declare global {
  namespace Express {
    interface Request {
      validatedStatusBody?: {
        status: "pending" | "completed" | "failed" | "cancelled";
      };
    }
  }
}

export {};
