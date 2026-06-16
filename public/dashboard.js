function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
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

async function copyText(text, statusEl, okMsg) {
  try {
    await navigator.clipboard.writeText(text);
    if (statusEl) {
      statusEl.textContent = okMsg;
      statusEl.className = "status-line success";
    }
  } catch {
    if (statusEl) {
      statusEl.textContent = "Copy failed — select and copy manually.";
      statusEl.className = "status-line error";
    }
  }
}

async function loadMe() {
  const data = await api("/dashboard/api/me");
  const email = data.user.email;
  document.getElementById("user-line").textContent = email;
  const avatar = document.getElementById("user-avatar");
  if (avatar && email) {
    avatar.textContent = email.charAt(0);
  }
}

function maskedKey(prefix) {
  return `${prefix}••••••••••`;
}

async function loadKeys() {
  const body = document.getElementById("keys-body");
  const data = await api("/dashboard/api/keys");

  if (!data.keys.length) {
    body.innerHTML =
      '<tr><td colspan="6" class="muted empty-cell">No API keys yet. Create one above to get started.</td></tr>';
    return;
  }

  body.innerHTML = data.keys
    .map((key) => {
      const statusBadge = key.revokedAt
        ? '<span class="badge badge-revoked">revoked</span>'
        : '<span class="badge badge-active">active</span>';
      const action = key.revokedAt
        ? "—"
        : `<button type="button" data-key-id="${escapeHtml(
            key.id,
          )}" class="btn btn-danger btn-sm revoke">Revoke</button>`;
      return `<tr>
        <td><code class="masked-key">${escapeHtml(maskedKey(key.keyPrefix))}</code></td>
        <td>${escapeHtml(key.label ?? "—")}</td>
        <td>${escapeHtml(formatDate(key.createdAt))}</td>
        <td>${escapeHtml(formatDate(key.lastUsedAt))}</td>
        <td>${statusBadge}</td>
        <td>${action}</td>
      </tr>`;
    })
    .join("");

  document.querySelectorAll(".revoke").forEach((button) => {
    button.addEventListener("click", async () => {
      const keyStatus = document.getElementById("key-status");
      try {
        await api(`/dashboard/api/keys/${button.dataset.keyId}`, {
          method: "DELETE",
        });
        keyStatus.textContent = "API key revoked.";
        keyStatus.className = "status-line success";
        await loadKeys();
      } catch (error) {
        keyStatus.textContent = error.message;
        keyStatus.className = "status-line error";
      }
    });
  });
}

function methodClass(method) {
  return `method-${String(method).toLowerCase()}`;
}

async function loadUsage() {
  const [summary, recent, byKey] = await Promise.all([
    api("/dashboard/api/usage/summary"),
    api("/dashboard/api/usage/recent"),
    api("/dashboard/api/usage/by-key"),
  ]);

  const setStat = (id, value) => {
    document.querySelectorAll(`#${id}, #${id}-2`).forEach((el) => {
      el.textContent = value;
    });
  };
  setStat("stat-total", summary.summary.totalRequests);
  setStat("stat-success", summary.summary.successCount);
  setStat("stat-errors", summary.summary.errorCount);
  setStat("stat-latency", `${summary.summary.avgLatencyMs} ms`);

  const usageByKeyEl = document.getElementById("usage-by-key");
  usageByKeyEl.innerHTML = byKey.usageByKey.length
    ? byKey.usageByKey
        .map(
          (row) =>
            `<li>
              <code class="grow">${escapeHtml(
                row.keyPrefix ?? row.apiKeyId ?? "unknown",
              )}</code>
              <span class="meta">${escapeHtml(row.requestCount)} requests</span>
            </li>`,
        )
        .join("")
    : '<li class="list-empty">No usage yet.</li>';

  const recentEl = document.getElementById("usage-recent");
  recentEl.innerHTML = recent.events.length
    ? recent.events
        .map((event) => {
          const ok = event.statusCode < 400;
          return `<li>
            <span class="method-badge ${methodClass(event.method)}">${escapeHtml(
              event.method,
            )}</span>
            <span class="path grow">${escapeHtml(event.path)}</span>
            <span class="status-code ${ok ? "ok" : "err"}">${escapeHtml(
              event.statusCode,
            )}</span>
            <span class="meta">${escapeHtml(event.latencyMs)} ms · ${escapeHtml(
              formatDate(event.createdAt),
            )}</span>
          </li>`;
        })
        .join("")
    : '<li class="list-empty">No requests yet.</li>';
}

function initNavigation() {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  const menuToggle = document.getElementById("menu-toggle");
  const links = document.querySelectorAll(".side-link");
  const views = document.querySelectorAll(".view");
  const pageTitle = document.getElementById("page-title");

  function closeSidebar() {
    sidebar.classList.remove("open");
    backdrop.hidden = true;
  }

  function showSection(section, label) {
    links.forEach((link) =>
      link.classList.toggle("active", link.dataset.section === section),
    );
    views.forEach((view) =>
      view.classList.toggle("active", view.dataset.view === section),
    );
    pageTitle.textContent = label;
    closeSidebar();
  }

  links.forEach((link) => {
    link.addEventListener("click", () => {
      showSection(link.dataset.section, link.textContent.trim());
    });
  });

  menuToggle.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");
    backdrop.hidden = !isOpen;
  });
  backdrop.addEventListener("click", closeSidebar);
}

function initDashboardPage() {
  initNavigation();

  const keyForm = document.getElementById("new-key-form");
  const keyLabel = document.getElementById("new-key-label");
  const keyStatus = document.getElementById("key-status");
  const createdKeyBox = document.getElementById("created-key-box");
  const createdKeyValue = document.getElementById("created-key-value");
  const copyCreatedKeyBtn = document.getElementById("copy-created-key");
  const logoutBtn = document.getElementById("logout-btn");

  let latestCreatedKey = "";

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
      keyStatus.textContent = "New key created. Copy it now — it won't be shown again.";
      keyStatus.className = "status-line success";
      keyLabel.value = "";
      await loadKeys();
    } catch (error) {
      keyStatus.textContent = error.message;
      keyStatus.className = "status-line error";
    }
  });

  copyCreatedKeyBtn.addEventListener("click", () => {
    if (!latestCreatedKey) return;
    copyText(latestCreatedKey, keyStatus, "Key copied to clipboard.");
  });

  logoutBtn.addEventListener("click", async () => {
    await api("/auth/logout", { method: "POST" });
    window.location.href = "/login";
  });

  Promise.all([loadMe(), loadKeys(), loadUsage()]).catch(() => {
    window.location.href = "/login";
  });
}

initDashboardPage();
