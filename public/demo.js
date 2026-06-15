const API_KEY_STORAGE = "payonce-demo-api-key";

const els = {
  apiKey: document.getElementById("api-key"),
  saveKey: document.getElementById("save-key"),
  healthBadge: document.getElementById("health-badge"),
  readyBadge: document.getElementById("ready-badge"),
  refreshHealth: document.getElementById("refresh-health"),
  amount: document.getElementById("amount"),
  customerId: document.getElementById("customer-id"),
  idempotencyKey: document.getElementById("idempotency-key"),
  generateKey: document.getElementById("generate-key"),
  createPayment: document.getElementById("create-payment"),
  refreshPayments: document.getElementById("refresh-payments"),
  paymentsBody: document.getElementById("payments-body"),
  responseLog: document.getElementById("response-log"),
};

function getApiKey() {
  return els.apiKey.value.trim();
}

function logResponse(label, data) {
  const text =
    typeof data === "string"
      ? data
      : JSON.stringify(data, null, 2);
  els.responseLog.textContent = `[${label}]\n${text}`;
}

async function api(path, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Enter an API key first.");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    ...(options.headers ?? {}),
  };

  const response = await fetch(path, { ...options, headers });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body.message ?? `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

function setBadge(el, state, label) {
  el.className = `badge ${state}`;
  el.textContent = label;
}

async function checkHealth() {
  setBadge(els.healthBadge, "pending", "Health: checking…");
  setBadge(els.readyBadge, "pending", "Ready: checking…");

  try {
    const health = await fetch("/health").then((r) => r.json());
    setBadge(
      els.healthBadge,
      health.status === "ok" ? "ok" : "fail",
      `Health: ${health.status}`,
    );
  } catch {
    setBadge(els.healthBadge, "fail", "Health: error");
  }

  try {
    const ready = await fetch("/ready").then((r) => r.json());
    setBadge(
      els.readyBadge,
      ready.status === "ready" ? "ok" : "fail",
      `Ready: ${ready.status}`,
    );
  } catch {
    setBadge(els.readyBadge, "fail", "Ready: error");
  }
}

function statusPill(status) {
  return `<span class="status-pill ${status}">${status}</span>`;
}

function renderPayments(payments) {
  if (!payments.length) {
    els.paymentsBody.innerHTML =
      '<tr><td colspan="6" class="empty">No payments yet. Create one above.</td></tr>';
    return;
  }

  els.paymentsBody.innerHTML = payments
    .map((payment) => {
      const transitions =
        payment.status === "pending"
          ? `<select data-id="${payment.id}" class="status-select">
              <option value="">Update…</option>
              <option value="completed">completed</option>
              <option value="failed">failed</option>
              <option value="cancelled">cancelled</option>
            </select>
            <button type="button" class="secondary apply-status" data-id="${payment.id}">Apply</button>`
          : `<span class="empty">—</span>`;

      return `<tr>
        <td><code>${payment.id}</code></td>
        <td>${payment.amount}</td>
        <td>${payment.customerId}</td>
        <td>${statusPill(payment.status)}</td>
        <td>${new Date(payment.createdAt).toLocaleString()}</td>
        <td><div class="actions">${transitions}</div></td>
      </tr>`;
    })
    .join("");

  document.querySelectorAll(".apply-status").forEach((button) => {
    button.addEventListener("click", () => void updateStatus(button.dataset.id));
  });
}

async function loadPayments() {
  try {
    const data = await api("/api/v1/payments");
    renderPayments(data.payments ?? []);
    logResponse("GET /api/v1/payments", data);
  } catch (error) {
    logResponse("GET /api/v1/payments", {
      error: error.message,
      ...(error.body ? { body: error.body } : {}),
    });
  }
}

async function createPayment() {
  const amount = Number(els.amount.value);
  const customerId = els.customerId.value.trim();
  const idempotencyKey = els.idempotencyKey.value.trim();

  if (!customerId || !idempotencyKey) {
    logResponse("Create payment", { error: "Customer ID and idempotency key are required." });
    return;
  }

  try {
    const data = await api("/api/v1/payments", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ amount, customerId }),
    });
    logResponse("POST /api/v1/payments", data);
    await loadPayments();
  } catch (error) {
    logResponse("POST /api/v1/payments", {
      error: error.message,
      ...(error.body ? { body: error.body } : {}),
    });
  }
}

async function updateStatus(paymentId) {
  const select = document.querySelector(
    `.status-select[data-id="${paymentId}"]`,
  );
  const status = select?.value;

  if (!status) {
    logResponse("Update status", { error: "Pick a status first." });
    return;
  }

  try {
    const data = await api(`/api/v1/payments/${paymentId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    logResponse(`PATCH /api/v1/payments/${paymentId}/status`, data);
    await loadPayments();
  } catch (error) {
    logResponse(`PATCH /api/v1/payments/${paymentId}/status`, {
      error: error.message,
      ...(error.body ? { body: error.body } : {}),
    });
  }
}

function generateIdempotencyKey() {
  els.idempotencyKey.value = crypto.randomUUID();
}

els.saveKey.addEventListener("click", () => {
  localStorage.setItem(API_KEY_STORAGE, getApiKey());
  logResponse("Settings", { message: "API key saved in this browser." });
});

els.refreshHealth.addEventListener("click", () => void checkHealth());
els.refreshPayments.addEventListener("click", () => void loadPayments());
els.createPayment.addEventListener("click", () => void createPayment());
els.generateKey.addEventListener("click", generateIdempotencyKey);

const savedKey = localStorage.getItem(API_KEY_STORAGE);
if (savedKey) {
  els.apiKey.value = savedKey;
}

generateIdempotencyKey();
void checkHealth();
void loadPayments();
