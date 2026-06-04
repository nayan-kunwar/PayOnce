import db from "../db/MemoryDB.js";

class IdempotencyRepository {
  findByKey(key) {
    console.log("DB:", db);
    console.log("idempotencyRecords ", db.idempotencyRecords);
    return db.idempotencyRecords.get(key);
  }

  save(record) {
    db.idempotencyRecords.set(record.key, record);
    return record;
  }
}

export default new IdempotencyRepository();
