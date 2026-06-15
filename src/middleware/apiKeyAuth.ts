import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";
import { UnauthorizedError } from "../errors/AppError.js";

function extractApiKey(req: Request): string | undefined {
  const authorization = req.header("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return req.header("x-api-key")?.trim();
}

export function apiKeyAuth(req: Request, _res: Response, next: NextFunction) {
  const apiKey = extractApiKey(req);

  if (!apiKey || !env.API_KEYS.includes(apiKey)) {
    return next(new UnauthorizedError());
  }

  next();
}
