import paymentService from "../services/PaymentService.js";

class PaymentController {
  createPayment(req, res) {
    const idempotencyKey = req.headers["idempotency-key"];

    if (!idempotencyKey) {
      return res.status(400).json({
        success: false,
        message: "Idempotency-Key header is required",
      });
    }

    const result = paymentService.createPayment(req.body, idempotencyKey);

    return res.status(201).json({
      success: true,
      ...result,
    });
  }

  getAllPayments(req, res) {
    const payments = paymentService.getAllPayments();

    return res.status(200).json({
      success: true,
      payments,
    });
  }
}

export default new PaymentController();
