import { Router } from "express";

import { paymentController } from "../controllers/PaymentController.js";
import { apiKeyAuth } from "../middleware/apiKeyAuth.js";
import {
  createPaymentRateLimiter,
  globalRateLimiter,
} from "../middleware/rateLimiter.js";
import { requireIdempotencyKey } from "../middleware/requireIdempotencyKey.js";
import { validateCreatePayment } from "../middleware/validateCreatePayment.js";
import { validateUpdatePaymentStatus } from "../middleware/validateUpdatePaymentStatus.js";

const router = Router();

router.use(apiKeyAuth);
router.use(globalRateLimiter);

router.post(
  "/payments",
  createPaymentRateLimiter,
  requireIdempotencyKey,
  validateCreatePayment,
  paymentController.createPayment,
);

router.get("/payments", paymentController.getAllPayments);
router.get("/payments/:id", paymentController.getPaymentById);

router.patch(
  "/payments/:id/status",
  validateUpdatePaymentStatus,
  paymentController.updatePaymentStatus,
);

export default router;
