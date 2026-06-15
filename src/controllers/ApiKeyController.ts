import type { NextFunction, Request, Response } from "express";

import { ValidationError } from "../errors/AppError.js";
import { apiKeyService } from "../services/ApiKeyService.js";

class ApiKeyController {
  createApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.validatedApiKeySignupBody) {
        throw new ValidationError("Invalid API key signup request");
      }

      const { email, label } = req.validatedApiKeySignupBody;
      const result = await apiKeyService.createApiKey(email, label);

      return res.status(201).json({
        success: true,
        apiKey: result.apiKey,
        keyPrefix: result.keyPrefix,
        message: "Save this key now — it will not be shown again.",
      });
    } catch (error) {
      next(error);
    }
  };
}

export const apiKeyController = new ApiKeyController();
