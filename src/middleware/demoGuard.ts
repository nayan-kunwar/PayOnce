import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";

export function demoEnabledGuard(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!env.DEMO_ENABLED) {
    return res.status(404).json({
      success: false,
      message: "Not found",
    });
  }

  next();
}

/**
 * In production, demo API routes are intended for the same-origin /demo UI.
 * Browsers send Sec-Fetch-Site on fetch(); skip the check in dev/test.
 */
export function demoSameOriginGuard(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (env.NODE_ENV !== "production") {
    return next();
  }

  const fetchSite = req.header("sec-fetch-site");
  if (fetchSite === "same-origin" || fetchSite === "same-site") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Demo API is only available from the PayOnce demo UI",
    code: "DEMO_FORBIDDEN",
  });
}
