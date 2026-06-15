import { Router } from "express";

import { apiKeyController } from "../controllers/ApiKeyController.js";
import { apiKeySignupRateLimiter } from "../middleware/rateLimiter.js";
import { signupEnabledGuard } from "../middleware/signupGuard.js";
import { validateApiKeySignup } from "../middleware/validateApiKeySignup.js";

const router = Router();

router.use(signupEnabledGuard);
router.post("/", apiKeySignupRateLimiter, validateApiKeySignup, apiKeyController.createApiKey);

export default router;
