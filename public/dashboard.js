const path = window.location.pathname;

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message ?? `Request failed (${response.status})`);
  }
  return body;
}

function initAuthPage() {
  const tabSignup = document.getElementById("tab-signup");
  const tabLogin = document.getElementById("tab-login");
  const form = document.getElementById("auth-form");
  const nameField = document.getElementById("name-field");
  const submit = document.getElementById("auth-submit");
  const status = document.getElementById("auth-status");

  let mode = "signup";

  function setMode(nextMode) {
    mode = nextMode;
    tabSignup.classList.toggle("active", mode === "signup");
    tabLogin.classList.toggle("active", mode === "login");
    nameField.hidden = mode !== "signup";
    submit.textContent = mode === "signup" ? "Create account" : "Log in";
    status.textContent =
      mode === "signup"
        ? "Create an account to continue."
        : "Log in with your existing account.";
  }

  tabSignup.addEventListener("click", () => setMode("signup"));
  tabLogin.addEventListener("click", () => setMode("login"));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const name = document.getElementById("auth-name").value.trim();

    submit.disabled = true;
    status.textContent = mode === "signup" ? "Creating account..." : "Logging in...";

    try {
      await api(mode === "signup" ? "/auth/signup" : "/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          ...(mode === "signup" && name ? { name } : {}),
        }),
      });

      window.location.href = "/dashboard";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
}

async function loadMe() {
  const data = await api("/dashboard/api/me");
  document.getElementById("user-line").textContent = `${data.user.email}`;
}

function maskedKey(prefix) {
  return `${prefix}••••••••••`;
}

async function copyText(text, statusEl, okMsg) {
  try {
    await navigator.clipboard.writeText(text);
    if (statusEl) statusEl.textContent = okMsg;
  } catch {
    if (statusEl) statusEl.textContent = "Copy failed — select and copy manually.";
  }
}

async function loadKeys() {
  const body = document.getElementById("keys-body");
  const data = await api("/dashboard/api/keys");

  if (!data.keys.length) {
    body.innerHTML = '<tr><td colspan="6" class="muted">No API keys yet.</td></tr>';
    return;
  }

  body.innerHTML = data.keys
    .map(
      (key) => `<tr>
        <td><code class="masked-key">${maskedKey(key.keyPrefix)}</code></td>
        <td>${key.label ?? "—"}</td>
        <td>${formatDate(key.createdAt)}</td>
        <td>${formatDate(key.lastUsedAt)}</td>
        <td>${key.revokedAt ? "revoked" : "active"}</td>
        <td>${
          key.revokedAt
            ? "—"
            : `<button type="button" data-key-id="${key.id}" class="revoke danger">Revoke</button>`
        }</td>
      </tr>`,
    )
    .join("");

  document.querySelectorAll(".revoke").forEach((button) => {
    button.addEventListener("click", async () => {
      const keyStatus = document.getElementById("key-status");
      try {
        await api(`/dashboard/api/keys/${button.dataset.keyId}`, {
          method: "DELETE",
        });
        keyStatus.textContent = "API key revoked.";
        await loadKeys();
      } catch (error) {
        keyStatus.textContent = error.message;
      }
    });
  });
}

async function loadUsage() {
  const [summary, recent, byKey] = await Promise.all([
    api("/dashboard/api/usage/summary"),
    api("/dashboard/api/usage/recent"),
    api("/dashboard/api/usage/by-key"),
  ]);

  const summaryEl = document.getElementById("usage-summary");
  summaryEl.innerHTML = `
    <div class="kv-item"><span>Total requests</span><strong>${summary.summary.totalRequests}</strong></div>
    <div class="kv-item"><span>Success</span><strong>${summary.summary.successCount}</strong></div>
    <div class="kv-item"><span>Errors</span><strong>${summary.summary.errorCount}</strong></div>
    <div class="kv-item"><span>Avg latency</span><strong>${summary.summary.avgLatencyMs} ms</strong></div>
  `;

  const usageByKeyEl = document.getElementById("usage-by-key");
  usageByKeyEl.innerHTML = byKey.usageByKey.length
    ? byKey.usageByKey
        .map(
          (row) =>
            `<li>${row.keyPrefix ?? row.apiKeyId ?? "unknown"} — ${row.requestCount} requests</li>`,
        )
        .join("")
    : "<li>No usage yet.</li>";

  const recentEl = document.getElementById("usage-recent");
  recentEl.innerHTML = recent.events.length
    ? recent.events
        .map(
          (event) =>
            `<li><strong>${event.method}</strong> ${event.path} → ${event.statusCode} (${event.latencyMs} ms) <span class="muted">${formatDate(event.createdAt)}</span></li>`,
        )
        .join("")
    : "<li>No events yet.</li>";
}

function initDashboardPage() {
  const keyForm = document.getElementById("new-key-form");
  const keyLabel = document.getElementById("new-key-label");
  const keyStatus = document.getElementById("key-status");
  const createdKeyBox = document.getElementById("created-key-box");
  const createdKeyValue = document.getElementById("created-key-value");
  const copyCreatedKeyBtn = document.getElementById("copy-created-key");
  const playMethod = document.getElementById("play-method");
  const playPath = document.getElementById("play-path");
  const playKey = document.getElementById("play-key");
  const playIdempotency = document.getElementById("play-idempotency");
  const playBody = document.getElementById("play-body");
  const playSend = document.getElementById("play-send");
  const playFillList = document.getElementById("play-fill-list");
  const playFillCreate = document.getElementById("play-fill-create");
  const playStatus = document.getElementById("play-status");
  const playOutput = document.getElementById("play-output");
  const playIdempotencyWrap = document.getElementById("play-idempotency-wrap");
  const playBodyWrap = document.getElementById("play-body-wrap");
  const logoutBtn = document.getElementById("logout-btn");

  let latestCreatedKey = "";

  function updatePlaygroundFields() {
    const method = playMethod.value;
    playIdempotencyWrap.hidden = method !== "POST";
    playBodyWrap.hidden = method === "GET";
  }

  async function sendPlaygroundRequest() {
    const method = playMethod.value;
    const requestPath = playPath.value.trim();
    const apiKey = playKey.value.trim();

    if (!requestPath.startsWith("/api/v1/")) {
      playStatus.textContent = "Path must start with /api/v1/.";
      return;
    }
    if (!apiKey) {
      playStatus.textContent = "Paste your API key first.";
      return;
    }

    playStatus.textContent = "Sending…";
    playSend.disabled = true;

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    };

    const init = { method, headers };

    if (method === "POST") {
      const idem = playIdempotency.value.trim();
      if (idem) headers["Idempotency-Key"] = idem;
      headers["Content-Type"] = "application/json";
      init.body = playBody.value;
    } else if (method === "PATCH") {
      headers["Content-Type"] = "application/json";
      init.body = playBody.value;
    }

    try {
      const res = await fetch(requestPath, init);
      const text = await res.text();
      let bodyDisplay = text;
      try {
        bodyDisplay = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* keep raw text */
      }
      playStatus.textContent = `${res.status} ${res.statusText}`;
      playOutput.textContent = bodyDisplay || "(empty body)";
    } catch (err) {
      playStatus.textContent = "Request failed.";
      playOutput.textContent = String(err);
    } finally {
      playSend.disabled = false;
    }
  }

  keyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const data = await api("/dashboard/api/keys", {
        method: "POST",
        body: JSON.stringify({
          label: keyLabel.value.trim() || undefined,
        }),
      });
      latestCreatedKey = data.apiKey;
      createdKeyValue.textContent = data.apiKey;
      createdKeyBox.hidden = false;
      playKey.value = data.apiKey;
      keyStatus.textContent = "New key created. Copy it now — it won't be shown again.";
      keyLabel.value = "";
      await loadKeys();
    } catch (error) {
      keyStatus.textContent = error.message;
    }
  });

  copyCreatedKeyBtn.addEventListener("click", () => {
    if (!latestCreatedKey) return;
    copyText(latestCreatedKey, keyStatus, "Key copied to clipboard.");
  });

  playMethod.addEventListener("change", updatePlaygroundFields);
  playSend.addEventListener("click", sendPlaygroundRequest);
  playFillList.addEventListener("click", () => {
    playMethod.value = "GET";
    playPath.value = "/api/v1/payments";
    updatePlaygroundFields();
  });
  playFillCreate.addEventListener("click", () => {
    playMethod.value = "POST";
    playPath.value = "/api/v1/payments";
    playIdempotency.value = `play_${Date.now()}`;
    playBody.value = JSON.stringify(
      { amount: 1000, customerId: "cust_playground" },
      null,
      2,
    );
    updatePlaygroundFields();
  });

  logoutBtn.addEventListener("click", async () => {
    await api("/auth/logout", { method: "POST" });
    window.location.href = "/login";
  });

  updatePlaygroundFields();

  Promise.all([loadMe(), loadKeys(), loadUsage()]).catch(() => {
    window.location.href = "/login";
  });
}

if (path === "/login") {
  initAuthPage();
}

if (path === "/dashboard") {
  initDashboardPage();
}
