# PayOnce 💳

PayOnce is a lightweight, production-grade mini payment system API built with Node.js, Express, and Bun. It demonstrates key **Low-Level Design (LLD)** concepts, layered architecture, and **idempotency handling** to prevent duplicate charges in distributed systems.

This project simulates how real-world payment providers like Stripe, PayPal, and Razorpay handle duplicate API requests gracefully using idempotency keys.

---

## 🚀 Features & Architecture

- **Idempotency Support:** Prevents duplicate payments using `Idempotency-Key` headers.
- **Layered Architecture:** Clear division of responsibilities (Controllers, Services, Repositories, Models, DB).
- **In-Memory Caching:** High-performance caching mechanism for idempotency checks.
- **TypeScript Support:** Configuration for modern ES Modules and Bun runtime environment.

### Project Structure
```text
src/
├── app.js                 # Express application setup
├── controllers/
│   └── PaymentController.js # Handles request validation and HTTP responses
├── services/
│   └── PaymentService.js    # Core business logic for processing and idempotency checks
├── repositories/
│   ├── PaymentRepository.js # Abstracts database access for payments
│   └── IdempotencyRepository.js # Abstracts database access for idempotency keys
├── db/
│   └── MemoryDB.js          # In-memory database singleton (using Map)
├── models/
│   ├── Payment.js           # Schema/Class for Payment records
│   └── IdempotencyRecord.js # Schema/Class for Idempotency tracking
├── middleware/              # Placeholder for request pipeline middleware
└── utils/
    └── generatePaymentId.js # Sequential ID generation utility
```

---

## 🛠️ Setup & Run

### Prerequisites
Make sure you have [Bun](https://bun.sh) installed.

### 1. Install Dependencies
```bash
bun install
```

### 2. Start the Server
```bash
bun run index.ts
```
The server will start running on `http://localhost:3000`.

---

## 🔌 API Documentation

### 1. Process a Payment
- **Endpoint:** `POST /api/v1/payments`
- **Headers:** 
  - `Content-Type: application/json`
  - `Idempotency-Key: <unique-string>` (Required)
- **Request Body:**
  ```json
  {
    "amount": 1000,
    "customerId": "cust_123"
  }
  ```

#### Responses:
- **First Request (Success - 201 Created):**
  ```json
  {
    "success": true,
    "fromCache": false,
    "payment": {
      "id": "pay_1",
      "amount": 1000,
      "customerId": "cust_123",
      "status": "pending"
    }
  }
  ```
- **Duplicate Request with Same Key (Success - 201 Created from Cache):**
  ```json
  {
    "success": true,
    "fromCache": true,
    "payment": {
      "id": "pay_1",
      "amount": 1000,
      "customerId": "cust_123",
      "status": "pending"
    }
  }
  ```
- **Missing Idempotency-Key Header (400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "Idempotency-Key header is required"
  }
  ```

---

### 2. Retrieve All Payments
- **Endpoint:** `GET /api/v1/payments`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "payments": [
      {
        "id": "pay_1",
        "amount": 1000,
        "customerId": "cust_123",
        "status": "pending"
      }
    ]
  }
  ```

---

## 🧪 Testing the Idempotency Flow

You can test the system's idempotency behavior using `curl`:

### Step 1: Create a Payment (First request)
```bash
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: payment_unique_key_101" \
  -d "{\"amount\": 1500, \"customerId\": \"cust_abc\"}"
```
*Observe that `fromCache` is `false`, and a new payment `pay_1` is returned.*

### Step 2: Retry with the Same Key (Duplicate request)
```bash
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: payment_unique_key_101" \
  -d "{\"amount\": 1500, \"customerId\": \"cust_abc\"}"
```
*Observe that `fromCache` is `true`, and the exact same `pay_1` details are returned. No new payment is created.*

### Step 3: Send a Request with a Different Key
```bash
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: payment_unique_key_102" \
  -d "{\"amount\": 1500, \"customerId\": \"cust_abc\"}"
```
*Observe that `fromCache` is `false`, and a new payment `pay_2` is returned.*

### Step 4: Verify All Payments Created
```bash
curl -X GET http://localhost:3000/api/v1/payments
```
*Only `pay_1` and `pay_2` will be returned, proving that the duplicate request did not create a third payment.*

---


