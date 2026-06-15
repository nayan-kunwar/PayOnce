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
  const healthChip = document.getElementById("health-chip");
  const readyChip = document.getElementById("ready-chip");
  const liveLabel = document.getElementById("live-label");
  const liveDot = document.getElementById("live-dot");

  try {
    const [health, ready] = await Promise.all([
      checkEndpoint("/health"),
      checkEndpoint("/ready"),
    ]);

    setChip(healthChip, health.ok, `/health — ${health.ok ? "ok" : "down"}`);
    setChip(readyChip, ready.ok, `/ready — ${ready.ok ? "ready" : "not ready"}`);

    const allOk = health.ok && ready.ok;
    liveLabel.textContent = allOk
      ? "All systems operational"
      : "Service degraded — check probes";
    liveDot.style.background = allOk ? "var(--success)" : "var(--danger)";
  } catch {
    setChip(healthChip, false, "/health — unreachable");
    setChip(readyChip, false, "/ready — unreachable");
    liveLabel.textContent = "Unable to reach API";
    liveDot.style.background = "var(--danger)";
  }
}

refreshStatus();
