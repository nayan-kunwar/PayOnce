import type { NextFunction, Request, Response } from "express";

import { usageService } from "../services/UsageService.js";

export function usageTracker(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();

  res.on("finish", () => {
    const context = req.apiKeyContext;
    const latencyMs = Date.now() - startedAt;

    void usageService.track({
      apiKeyId: context?.apiKeyId ?? null,
      userId: context?.userId ?? null,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      latencyMs,
    });
  });

  next();
}
