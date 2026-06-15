import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";
import { ValidationError } from "../errors/AppError.js";
import { authService } from "../services/AuthService.js";
import { getCookieValue } from "../utils/cookies.js";

function sessionCookie(token: string): string {
  const parts = [
    `${env.SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${env.SESSION_TTL_HOURS * 60 * 60}`,
  ];

  if (env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function clearSessionCookie(): string {
  const parts = [
    `${env.SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];

  if (env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

class AuthController {
  signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.validatedSignupBody) {
        throw new ValidationError("Invalid signup request");
      }

      const { email, password, name } = req.validatedSignupBody;
      const result = await authService.signup(email, password, name);

      res.setHeader("Set-Cookie", sessionCookie(result.sessionToken));
      return res.status(201).json({
        success: true,
        user: result.user,
      });
    } catch (error) {
      return next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.validatedLoginBody) {
        throw new ValidationError("Invalid login request");
      }

      const { email, password } = req.validatedLoginBody;
      const result = await authService.login(email, password);

      res.setHeader("Set-Cookie", sessionCookie(result.sessionToken));
      return res.status(200).json({
        success: true,
        user: result.user,
      });
    } catch (error) {
      return next(error);
    }
  };

  me = (req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      user: req.authUser,
    });
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = getCookieValue(req.header("cookie"), env.SESSION_COOKIE_NAME);
      if (token) {
        await authService.logout(token);
      }

      res.setHeader("Set-Cookie", clearSessionCookie());
      return res.status(200).json({
        success: true,
        message: "Logged out",
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const authController = new AuthController();
