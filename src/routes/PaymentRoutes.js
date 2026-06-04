import { Router } from "express";

import paymentController from "../controllers/PaymentController.js";

const router = Router();

router.post("/payments", paymentController.createPayment);

router.get("/payments", paymentController.getAllPayments);

export default router;
