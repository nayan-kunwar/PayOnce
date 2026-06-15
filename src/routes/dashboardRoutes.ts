import { Router } from "express";

import { dashboardController } from "../controllers/DashboardController.js";
import { sessionAuth } from "../middleware/sessionAuth.js";

const router = Router();

router.use(sessionAuth);

router.get("/me", dashboardController.me);
router.get("/keys", dashboardController.listApiKeys);
router.post("/keys", dashboardController.createApiKey);
router.delete("/keys/:id", dashboardController.revokeApiKey);
router.get("/usage/summary", dashboardController.usageSummary);
router.get("/usage/recent", dashboardController.usageRecent);
router.get("/usage/by-key", dashboardController.usageByKey);

export default router;
