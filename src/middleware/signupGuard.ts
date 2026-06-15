import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";

export function signupEnabledGuard(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!env.SIGNUP_ENABLED) {
    return res.status(404).json({
      success: false,
      message: "Not found",
      code: "NOT_FOUND",
    });
  }

  next();
}
