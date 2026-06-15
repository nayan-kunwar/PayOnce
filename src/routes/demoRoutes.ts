import { Router } from "express";

import { paymentController } from "../controllers/PaymentController.js";
import {
  demoEnabledGuard,
  demoSameOriginGuard,
} from "../middleware/demoGuard.js";
import {
  demoCreatePaymentRateLimiter,
  demoGlobalRateLimiter,
} from "../middleware/rateLimiter.js";
import { requireIdempotencyKey } from "../middleware/requireIdempotencyKey.js";
import { validateCreatePayment } from "../middleware/validateCreatePayment.js";
import { validateUpdatePaymentStatus } from "../middleware/validateUpdatePaymentStatus.js";

const router = Router();

router.use(demoEnabledGuard);
router.use(demoSameOriginGuard);
router.use(demoGlobalRateLimiter);

router.post(
  "/payments",
  demoCreatePaymentRateLimiter,
  requireIdempotencyKey,
  validateCreatePayment,
  paymentController.createPayment,
);

router.get("/payments", paymentController.getAllPayments);

router.patch(
  "/payments/:id/status",
  validateUpdatePaymentStatus,
  paymentController.updatePaymentStatus,
);

export default router;
