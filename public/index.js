const els = {
  healthChip: document.getElementById("health-chip"),
  readyChip: document.getElementById("ready-chip"),
  liveLabel: document.getElementById("live-label"),
  liveDot: document.getElementById("live-dot"),
  signupForm: document.getElementById("signup-form"),
  signupEmail: document.getElementById("signup-email"),
  signupLabel: document.getElementById("signup-label"),
  signupSubmit: document.getElementById("signup-submit"),
  signupStatus: document.getElementById("signup-status"),
  signupResult: document.getElementById("signup-result"),
  apiKeyValue: document.getElementById("api-key-value"),
  copyApiKey: document.getElementById("copy-api-key"),
};

let latestApiKey = "";

function setChip(el, ok, label) {
  el.textContent = label;
  el.classList.remove("pending", "ok", "fail");
  el.classList.add(ok ? "ok" : "fail");
}

function setSignupStatus(message, type = "") {
  els.signupStatus.textContent = message;
  els.signupStatus.className = "signup-status";
  if (type) {
    els.signupStatus.classList.add(type);
  }
}

async function checkEndpoint(path) {
  const res = await fetch(path);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

async function refreshStatus() {
  try {
    const [health, ready] = await Promise.all([
      checkEndpoint("/health"),
      checkEndpoint("/ready"),
    ]);

    setChip(els.healthChip, health.ok, `/health — ${health.ok ? "ok" : "down"}`);
    setChip(
      els.readyChip,
      ready.ok,
      `/ready — ${ready.ok ? "ready" : "not ready"}`,
    );

    const allOk = health.ok && ready.ok;
    els.liveLabel.textContent = allOk
      ? "All systems operational"
      : "Service degraded — check probes";
    els.liveDot.style.background = allOk ? "var(--success)" : "var(--danger)";
  } catch {
    setChip(els.healthChip, false, "/health — unreachable");
    setChip(els.readyChip, false, "/ready — unreachable");
    els.liveLabel.textContent = "Unable to reach API";
    els.liveDot.style.background = "var(--danger)";
  }
}

async function createApiKey(event) {
  event.preventDefault();

  const email = els.signupEmail.value.trim();
  const label = els.signupLabel.value.trim();

  if (!email) {
    setSignupStatus("Email is required.", "error");
    return;
  }

  els.signupSubmit.disabled = true;
  setSignupStatus("Generating API key...");

  try {
    const response = await fetch("/api/keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        ...(label ? { label } : {}),
      }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.message ?? `Request failed (${response.status})`);
    }

    latestApiKey = body.apiKey;
    els.apiKeyValue.textContent = body.apiKey;
    els.signupResult.hidden = false;
    setSignupStatus("API key generated. Copy and store it securely.", "success");
    els.signupForm.reset();
  } catch (error) {
    setSignupStatus(error.message ?? "Failed to generate API key.", "error");
  } finally {
    els.signupSubmit.disabled = false;
  }
}

async function copyApiKey() {
  if (!latestApiKey) return;

  try {
    await navigator.clipboard.writeText(latestApiKey);
    setSignupStatus("Copied API key to clipboard.", "success");
  } catch {
    setSignupStatus("Could not copy key. Please copy manually.", "error");
  }
}

els.signupForm.addEventListener("submit", (event) => {
  void createApiKey(event);
});
els.copyApiKey.addEventListener("click", () => {
  void copyApiKey();
});

void refreshStatus();
