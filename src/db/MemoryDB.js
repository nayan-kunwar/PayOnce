class MemoryDB {
  constructor() {
    this.payments = new Map();
    this.idempotencyRecords = new Map();
  }
}

export default new MemoryDB(); // exporting an instance
