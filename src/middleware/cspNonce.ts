import crypto from "node:crypto";

import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Locals {
      cspNonce?: string;
    }
  }
}

export function cspNonce(_req: Request, res: Response, next: NextFunction) {
  res.locals.cspNonce = crypto.randomBytes(16).toString("base64");
  next();
}

export {};