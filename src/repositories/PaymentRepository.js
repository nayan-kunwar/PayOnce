import db from "../db/MemoryDB.js";

class PaymentRepository {
  save(payment) {
    db.payments.set(payment.id, payment);
    return payment;
  }
  findById(id) {
    return db.payments.get(id);
  }

  findAll() {
    return [...db.payments.values()];
  }
}

export default new PaymentRepository();
