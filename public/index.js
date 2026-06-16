const els = {
  healthChip: document.getElementById("health-chip"),
  readyChip: document.getElementById("ready-chip"),
  liveLabel: document.getElementById("live-label"),
  liveDot: document.getElementById("live-dot"),
};

function setChip(el, ok, label) {
  el.textContent = label;
  el.classList.remove("pending", "ok", "fail");
  el.classList.add(ok ? "ok" : "fail");
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

void refreshStatus();
