import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";
import { UnauthorizedError } from "../errors/AppError.js";
import { apiKeyService } from "../services/ApiKeyService.js";

function extractApiKey(req: Request): string | undefined {
  const xApiKey = req.header("x-api-key")?.trim();
  if (xApiKey) {
    return xApiKey;
  }

  const authorization = req.header("authorization");
  if (!authorization) {
    return undefined;
  }

  for (const part of authorization.split(",")) {
    const match = part.trim().match(/^Bearer\s+(\S+)/i);
    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}

export async function apiKeyAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const apiKey = extractApiKey(req);

    if (!apiKey) {
      return next(new UnauthorizedError());
    }

    if (env.API_KEYS.includes(apiKey)) {
      req.apiKeyContext = null;
      return next();
    }

    const apiKeyContext = await apiKeyService.validateApiKey(apiKey);
    if (!apiKeyContext) {
      return next(new UnauthorizedError());
    }

    req.apiKeyContext = apiKeyContext;
    return next();
  } catch (error) {
    return next(error);
  }
}

declare global {
  namespace Express {
    interface Request {
      apiKeyContext?: {
        apiKeyId: string;
        userId: string | null;
      } | null;
    }
  }
}

export { };
