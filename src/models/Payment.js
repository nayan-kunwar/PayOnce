class Payment {
  constructor({ id, amount, customerId, status = "pending" }) {
    this.id = id;
    this.amount = amount;
    this.customerId = customerId;
    this.status = status; // e.g., 'pending', 'completed', 'failed'
  }
}

export default Payment;
