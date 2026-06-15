// ─── Auth page logic ────────────────────────────────────────────
const tabSignup = document.getElementById("tab-signup");
const tabLogin = document.getElementById("tab-login");
const form = document.getElementById("auth-form");
const nameField = document.getElementById("name-field");
const authCard = document.getElementById("auth-card");
const title = document.getElementById("auth-title");
const subtitle = document.getElementById("auth-subtitle");
const submit = document.getElementById("auth-submit");
const submitLabel = submit.querySelector(".auth-submit-label");
const status = document.getElementById("auth-status");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const nameInput = document.getElementById("auth-name");
const togglePassword = document.getElementById("toggle-password");
const strengthBars = [
  document.getElementById("str-1"),
  document.getElementById("str-2"),
  document.getElementById("str-3"),
  document.getElementById("str-4"),
];
const passwordStrength = document.getElementById("password-strength");
const passwordHint = document.getElementById("password-hint");

let mode = "signup";

// ─── Tab switching ──────────────────────────────────────────────
function setMode(nextMode) {
  mode = nextMode;
  tabSignup.classList.toggle("active", mode === "signup");
  tabLogin.classList.toggle("active", mode === "login");

  if (mode === "signup") {
    nameField.classList.remove("hidden");
    title.textContent = "Create your account";
    subtitle.textContent = "Start building with the PayOnce payment API";
    submitLabel.textContent = "Create account";
    passwordInput.autocomplete = "new-password";
    passwordStrength.style.display = "flex";
    passwordHint.style.display = "block";
  } else {
    nameField.classList.add("hidden");
    title.textContent = "Welcome back";
    subtitle.textContent = "Sign in to your PayOnce developer account";
    submitLabel.textContent = "Sign in";
    passwordInput.autocomplete = "current-password";
    passwordStrength.style.display = "none";
    passwordHint.style.display = "none";
  }

  // Clear status
  status.textContent = "";
  status.className = "auth-status";
}

tabSignup.addEventListener("click", () => setMode("signup"));
tabLogin.addEventListener("click", () => setMode("login"));

// ─── Password visibility toggle ────────────────────────────────
togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.textContent = isPassword ? "🙈" : "👁️";
});

// ─── Password strength meter ───────────────────────────────────
function evaluateStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}

function updateStrength() {
  if (mode !== "signup") return;

  const password = passwordInput.value;
  const score = evaluateStrength(password);

  const levels = ["weak", "weak", "medium", "strong", "strong"];
  const level = levels[score];

  strengthBars.forEach((bar, i) => {
    bar.className = "strength-bar";
    if (i < score && password.length > 0) {
      bar.classList.add("active", level);
    }
  });

  if (password.length === 0) {
    passwordHint.textContent = "Use 8+ characters with a mix of letters and numbers";
  } else if (score <= 1) {
    passwordHint.textContent = "Weak — add uppercase, numbers, or symbols";
  } else if (score === 2) {
    passwordHint.textContent = "Fair — try adding more variety";
  } else if (score === 3) {
    passwordHint.textContent = "Good — almost there";
  } else {
    passwordHint.textContent = "Strong password ✓";
  }
}

passwordInput.addEventListener("input", updateStrength);

// ─── API helper ─────────────────────────────────────────────────
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

// ─── Error shake animation ──────────────────────────────────────
function shakeCard() {
  authCard.classList.remove("shake");
  void authCard.offsetWidth; // force reflow
  authCard.classList.add("shake");
}

// ─── Form submission ────────────────────────────────────────────
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const name = nameInput.value.trim();

  if (!email) {
    status.textContent = "Please enter your email address";
    status.className = "auth-status error";
    shakeCard();
    emailInput.focus();
    return;
  }

  if (password.length < 8) {
    status.textContent = "Password must be at least 8 characters";
    status.className = "auth-status error";
    shakeCard();
    passwordInput.focus();
    return;
  }

  // Set loading state
  submit.disabled = true;
  submit.classList.add("loading");
  status.textContent = "";
  status.className = "auth-status";

  try {
    await api(mode === "signup" ? "/auth/signup" : "/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        ...(mode === "signup" && name ? { name } : {}),
      }),
    });

    status.textContent = mode === "signup" ? "Account created! Redirecting…" : "Signed in! Redirecting…";
    status.className = "auth-status success";

    // Slight delay for the success message to be visible
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 400);
  } catch (error) {
    status.textContent = error.message;
    status.className = "auth-status error";
    shakeCard();
  } finally {
    submit.disabled = false;
    submit.classList.remove("loading");
  }
});

// ─── Auto-focus & session check ─────────────────────────────────
nameInput.focus();

async function checkSession() {
  try {
    const res = await fetch("/auth/me");
    if (res.ok) {
      const body = await res.json();
      if (body && body.success) {
        window.location.href = "/dashboard";
      }
    }
  } catch {
    // Ignore error and stay on auth page
  }
}
checkSession();
