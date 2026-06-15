import { Router } from "express";

import { authController } from "../controllers/AuthController.js";
import {
  authLoginRateLimiter,
  authSignupRateLimiter,
} from "../middleware/rateLimiter.js";
import { sessionAuth } from "../middleware/sessionAuth.js";
import { validateLogin, validateSignup } from "../middleware/validateAuth.js";

const router = Router();

router.post("/signup", authSignupRateLimiter, validateSignup, authController.signup);
router.post("/login", authLoginRateLimiter, validateLogin, authController.login);
router.get("/me", sessionAuth, authController.me);
router.post("/logout", sessionAuth, authController.logout);

export default router;
