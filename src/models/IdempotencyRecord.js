class IdempotencyRecord {
  constructor({ key, response }) {
    this.key = key;
    this.response = response;
    this.createdAt = new Date();
  }
}

export default IdempotencyRecord;
