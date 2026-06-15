import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";
import { UnauthorizedError } from "../errors/AppError.js";
import { authService } from "../services/AuthService.js";
import { getCookieValue } from "../utils/cookies.js";

export async function sessionAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = getCookieValue(req.header("cookie"), env.SESSION_COOKIE_NAME);
    if (!token) {
      return next(new UnauthorizedError("Authentication required"));
    }

    const user = await authService.getUserBySessionToken(token);
    if (!user) {
      return next(new UnauthorizedError("Invalid or expired session"));
    }

    req.authUser = user;
    return next();
  } catch (error) {
    return next(error);
  }
}
