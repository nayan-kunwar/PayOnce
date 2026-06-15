import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { NotFoundError, ValidationError } from "../errors/AppError.js";
import { apiKeyService } from "../services/ApiKeyService.js";
import { usageService } from "../services/UsageService.js";

const createPersonalApiKeySchema = z.object({
  label: z
    .string({ error: "label must be a string" })
    .trim()
    .max(80, "label must be at most 80 characters")
    .optional(),
});

class DashboardController {
  me = (req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      user: req.authUser,
    });
  };

  listApiKeys = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.authUser) {
        throw new ValidationError("Authentication required");
      }

      const keys = await apiKeyService.listPersonalApiKeys(req.authUser.id);
      return res.status(200).json({
        success: true,
        keys,
      });
    } catch (error) {
      return next(error);
    }
  };

  createApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.authUser) {
        throw new ValidationError("Authentication required");
      }

      const result = createPersonalApiKeySchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(
          "Invalid API key create request",
          result.error.flatten(),
        );
      }

      const created = await apiKeyService.createPersonalApiKey(
        req.authUser.id,
        req.authUser.email,
        result.data.label,
      );

      return res.status(201).json({
        success: true,
        apiKey: created.apiKey,
        keyPrefix: created.keyPrefix,
        message: "Save this key now — it will not be shown again.",
      });
    } catch (error) {
      return next(error);
    }
  };

  revokeApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.authUser) {
        throw new ValidationError("Authentication required");
      }

      const revoked = await apiKeyService.revokePersonalApiKey(
        req.authUser.id,
        String(req.params.id),
      );
      if (!revoked) {
        throw new NotFoundError("API key not found");
      }

      return res.status(200).json({
        success: true,
        message: "API key revoked",
      });
    } catch (error) {
      return next(error);
    }
  };

  usageSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.authUser) {
        throw new ValidationError("Authentication required");
      }

      const summary = await usageService.getSummary(req.authUser.id);
      return res.status(200).json({
        success: true,
        summary,
      });
    } catch (error) {
      return next(error);
    }
  };

  usageRecent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.authUser) {
        throw new ValidationError("Authentication required");
      }

      const events = await usageService.getRecent(req.authUser.id);
      return res.status(200).json({
        success: true,
        events,
      });
    } catch (error) {
      return next(error);
    }
  };

  usageByKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.authUser) {
        throw new ValidationError("Authentication required");
      }

      const usageByKey = await usageService.getByKey(req.authUser.id);
      return res.status(200).json({
        success: true,
        usageByKey,
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const dashboardController = new DashboardController();
