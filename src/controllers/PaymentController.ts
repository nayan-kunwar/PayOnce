import type { Request, Response, NextFunction } from "express";

import { ValidationError } from "../errors/AppError.js";
import { paymentService } from "../services/PaymentService.js";

class PaymentController {
  createPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.validatedBody || !req.idempotencyKey) {
        throw new ValidationError("Invalid payment request");
      }

      const result = await paymentService.createPayment(
        req.validatedBody,
        req.idempotencyKey,
      );

      return res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  getPaymentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await paymentService.getPaymentById(String(req.params.id));

      return res.status(200).json({
        success: true,
        payment,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllPayments = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const payments = await paymentService.getAllPayments();

      return res.status(200).json({
        success: true,
        payments,
      });
    } catch (error) {
      next(error);
    }
  };

  updatePaymentStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.validatedStatusBody) {
        throw new ValidationError("Invalid status update request");
      }

      const payment = await paymentService.updatePaymentStatus(
        String(req.params.id),
        req.validatedStatusBody.status,
      );

      return res.status(200).json({
        success: true,
        payment,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const paymentController = new PaymentController();
