import { randomUUID } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

export function requestId(req: Request, res: Response, next: NextFunction) {
  const incomingRequestId = req.header("x-request-id");
  const requestIdValue = incomingRequestId ?? randomUUID();

  req.requestId = requestIdValue;
  res.setHeader("X-Request-Id", requestIdValue);
  next();
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export {};
