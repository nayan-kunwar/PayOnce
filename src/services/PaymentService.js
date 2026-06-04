import Payment from "../models/Payment.js";
import IdempotencyRecord from "../models/IdempotencyRecord.js";

import paymentRepository from "../repositories/PaymentRepository.js";
import idempotencyRepository from "../repositories/IdempotencyRepository.js";

import { generatePaymentId } from "../utils/generatePaymentId.js";

class PaymentService {
  createPayment(data, idempotencyKey) {
    console.log("data; ", data);
    const existingRecord = idempotencyRepository.findByKey(idempotencyKey);

    if (existingRecord) {
      return {
        fromCache: true,
        payment: existingRecord.response,
      };
    }

    const payment = new Payment({
      id: generatePaymentId(),
      amount: data.amount,
      customerId: data.customerId,
    });

    paymentRepository.save(payment);

    const record = new IdempotencyRecord({
      key: idempotencyKey,
      response: payment,
    });

    idempotencyRepository.save(record);

    return {
      fromCache: false,
      payment,
    };
  }

  getAllPayments() {
    return paymentRepository.findAll();
  }
}

export default new PaymentService();
