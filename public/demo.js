const DEMO_API_PREFIX = "/demo/api";

const els = {
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
  statusBar: document.getElementById("status-bar"),
  statusText: document.getElementById("status-text"),
  statusSpinner: document.getElementById("status-spinner"),
};

function setStatus(message, type = "idle") {
  els.statusBar.className = `status-bar ${type}`;
  els.statusText.textContent = message;
  els.statusSpinner.hidden = type !== "loading";
}

function logResponse(label, data) {
  const text =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);
  els.responseLog.textContent = `[${label}]\n${text}`;
}

async function withLoading(button, labels, fn) {
  const originalText = button.textContent;
  button.disabled = true;
  button.classList.add("loading");
  button.textContent = labels.loading;
  setStatus(labels.status, "loading");
  logResponse(labels.status, { status: "loading" });

  try {
    const result = await fn();
    setStatus(labels.success, "success");
    return result;
  } catch (error) {
    const message = error.message ?? "Something went wrong";
    setStatus(`${labels.errorPrefix}: ${message}`, "error");
    throw error;
  } finally {
    button.disabled = false;
    button.classList.remove("loading");
    button.textContent = originalText;
  }
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  const response = await fetch(`${DEMO_API_PREFIX}${path}`, {
    ...options,
    headers,
  });
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
    button.addEventListener("click", () =>
      void withLoading(
        button,
        {
          loading: "Applying…",
          status: "Updating payment status",
          success: "Payment status updated",
          errorPrefix: "Status update failed",
        },
        async () => {
          await updateStatus(button.dataset.id);
        },
      ),
    );
  });
}

async function loadPayments({ silent = false } = {}) {
  const run = async () => {
    const data = await api("/payments");
    renderPayments(data.payments ?? []);
    logResponse("GET /demo/api/payments", data);
  };

  if (silent) {
    try {
      await run();
    } catch (error) {
      logResponse("GET /demo/api/payments", {
        error: error.message,
        ...(error.body ? { body: error.body } : {}),
      });
    }
    return;
  }

  await withLoading(
    els.refreshPayments,
    {
      loading: "Refreshing…",
      status: "Loading payments",
      success: "Payments loaded",
      errorPrefix: "Load failed",
    },
    async () => {
      try {
        await run();
      } catch (error) {
        logResponse("GET /demo/api/payments", {
          error: error.message,
          ...(error.body ? { body: error.body } : {}),
        });
        throw error;
      }
    },
  );
}

async function createPayment() {
  const amount = Number(els.amount.value);
  const customerId = els.customerId.value.trim();
  const idempotencyKey = els.idempotencyKey.value.trim();

  if (!customerId || !idempotencyKey) {
    const message = "Customer ID and idempotency key are required.";
    setStatus(message, "error");
    logResponse("Create payment", { error: message });
    return;
  }

  await withLoading(
    els.createPayment,
    {
      loading: "Creating…",
      status: "Creating payment",
      success: "Payment created",
      errorPrefix: "Create failed",
    },
    async () => {
      try {
        const data = await api("/payments", {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey },
          body: JSON.stringify({ amount, customerId }),
        });
        logResponse("POST /demo/api/payments", data);
        await loadPayments({ silent: true });
      } catch (error) {
        logResponse("POST /demo/api/payments", {
          error: error.message,
          ...(error.body ? { body: error.body } : {}),
        });
        throw error;
      }
    },
  );
}

async function updateStatus(paymentId) {
  const select = document.querySelector(
    `.status-select[data-id="${paymentId}"]`,
  );
  const status = select?.value;

  if (!status) {
    setStatus("Pick a status first.", "error");
    logResponse("Update status", { error: "Pick a status first." });
    throw new Error("Pick a status first.");
  }

  try {
    const data = await api(`/payments/${paymentId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    logResponse(`PATCH /demo/api/payments/${paymentId}/status`, data);
    await loadPayments({ silent: true });
  } catch (error) {
    logResponse(`PATCH /demo/api/payments/${paymentId}/status`, {
      error: error.message,
      ...(error.body ? { body: error.body } : {}),
    });
    throw error;
  }
}

function generateIdempotencyKey({ announce = true } = {}) {
  els.idempotencyKey.value = crypto.randomUUID();
  if (!announce) return;

  setStatus("New idempotency key generated", "success");
  logResponse("Generate key", {
    idempotencyKey: els.idempotencyKey.value,
  });
}

els.refreshHealth.addEventListener("click", () =>
  void withLoading(
    els.refreshHealth,
    {
      loading: "Checking…",
      status: "Checking health and readiness",
      success: "Health check complete",
      errorPrefix: "Health check failed",
    },
    checkHealth,
  ),
);

els.refreshPayments.addEventListener("click", () => void loadPayments());
els.createPayment.addEventListener("click", () => void createPayment());
els.generateKey.addEventListener("click", generateIdempotencyKey);

generateIdempotencyKey({ announce: false });
setStatus("Loading initial data…", "loading");
void (async () => {
  try {
    await checkHealth();
    await loadPayments({ silent: true });
    setStatus("Ready — try creating a payment or updating status.", "idle");
  } catch {
    setStatus("Ready — some checks failed. See Last response below.", "error");
  }
})();
