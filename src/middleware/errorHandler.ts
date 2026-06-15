import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/AppError.js";
import { env } from "../config/env.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      ...(error.errors !== undefined ? { errors: error.errors } : {}),
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
    ...(env.NODE_ENV === "development" && error instanceof Error
      ? { detail: error.message }
      : {}),
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    message: "Route not found",
    code: "NOT_FOUND",
  });
}
