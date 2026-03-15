  let cur = 'si';

  function go(t) {
    if (t === cur) return;
    cur = t;
    const su = t === 'su';
    document.getElementById('f-track').classList.toggle('slid', su);
    document.getElementById('h-track').classList.toggle('slid', su);
  }

  function togglePw(id, btn) {
    const el = document.getElementById(id);
    const vis = el.type === 'text';
    el.type = vis ? 'password' : 'text';
    btn.querySelector('.ei').innerHTML = vis
      ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
      : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  }

  function checkStrength(inp) {
    const v = inp.value;
    let n = 0;
    if (v.length >= 8) n++;
    if (/[A-Z]/.test(v)) n++;
    if (/[0-9]/.test(v)) n++;
    if (/[^A-Za-z0-9]/.test(v)) n++;
    const cls = n <= 1 ? 'w' : n <= 3 ? 'm' : 's';
    for (let i = 1; i <= 4; i++)
      document.getElementById('s'+i).className = 'seg' + (i <= n ? ' '+cls : '');
  }

  function ripple(e, btn) {
    const r = document.createElement('span');
    r.className = 'ripple';
    const sz = Math.max(btn.offsetWidth, btn.offsetHeight);
    const rc = btn.getBoundingClientRect();
    r.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX-rc.left-sz/2}px;top:${e.clientY-rc.top-sz/2}px`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 600);
  }

  const SESSION_KEY = "novyn-session";
  const REMEMBER_KEY = "novyn-remember";
  const DASHBOARD_PATH = "/index.html";
  const socketAvailable = typeof io === "function";
  const SOCKET_URL = window.location.origin.replace(/\/$/, "");
  const socket = socketAvailable ? io(SOCKET_URL) : null;

  const rememberCheckbox = document.getElementById("rememberMe");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const resetModal = document.getElementById("resetModal");
  const resetEmailInput = document.getElementById("resetEmail");
  const resetRequestBtn = document.getElementById("resetRequestBtn");
  const resetCodeInput = document.getElementById("resetCode");
  const resetNewPasswordInput = document.getElementById("resetNewPassword");
  const resetConfirmPasswordInput = document.getElementById("resetConfirmPassword");
  const resetConfirmBtn = document.getElementById("resetConfirmBtn");
  const resetMessage = document.getElementById("resetMessage");
  const resetDevToken = document.getElementById("resetDevToken");

  const loginIdentifierInput = document.getElementById("loginIdentifier");
  const loginPasswordInput = document.getElementById("loginPassword");
  const signInBtn = document.getElementById("signInBtn");

  const signUpNameInput = document.getElementById("signupName");
  const signUpHandleInput = document.getElementById("signupHandle");
  const signUpEmailInput = document.getElementById("signupEmail");
  const signUpPasswordInput = document.getElementById("signupPassword");
  const signUpBtn = document.getElementById("signUpBtn");

  const authMessage = document.getElementById("authMessage");
  const statUsers = document.getElementById("statUsers");
  const statOnline = document.getElementById("statOnline");
  const statMessages = document.getElementById("statMessages");
  const statNewUsers = document.getElementById("statNewUsers");

  let pendingCredentials = null;
  let pendingReset = false;

  function formatStat(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return "—";
    return new Intl.NumberFormat().format(num);
  }

  function bumpStat(el) {
    const card = el?.closest(".hero-stat");
    if (!card) return;
    card.classList.remove("stat-bump");
    void card.offsetWidth;
    card.classList.add("stat-bump");
  }

  function animateStat(el, nextValue) {
    if (!el || !Number.isFinite(nextValue)) return;
    const prevValue = Number(el.getAttribute("data-value"));
    if (!Number.isFinite(prevValue)) {
      el.textContent = formatStat(nextValue);
      el.setAttribute("data-value", String(nextValue));
      return;
    }
    if (prevValue === nextValue) return;

    const start = performance.now();
    const duration = 500;
    const diff = nextValue - prevValue;

    function step(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(prevValue + diff * eased);
      el.textContent = formatStat(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.setAttribute("data-value", String(nextValue));
        bumpStat(el);
      }
    }

    requestAnimationFrame(step);
  }

  async function loadStats() {
    if (!statUsers && !statOnline && !statMessages) return;
    try {
      const response = await fetch("/api/stats", { cache: "no-store" });
      if (!response.ok) throw new Error("stats");
      const data = await response.json();
      const users = Number(data?.users ?? 0);
      const online = Number(data?.online ?? 0);
      const messages = Number(data?.messages ?? 0);
      const newUsersToday = Number(data?.newUsersToday ?? 0);
      if (statUsers) animateStat(statUsers, users);
      if (statOnline) animateStat(statOnline, online);
      if (statMessages) animateStat(statMessages, messages);
      if (statNewUsers) animateStat(statNewUsers, newUsersToday);
    } catch (_) {
      // Keep placeholders if stats are unavailable.
    }
  }

  try {
    if (rememberCheckbox && localStorage.getItem(REMEMBER_KEY) === "1") {
      rememberCheckbox.checked = true;
    }
  } catch (_) {}

  function showResetMessage(text, type) {
    if (!resetMessage) return;
    resetMessage.textContent = text || "";
    resetMessage.classList.remove("error", "success");
    if (type) resetMessage.classList.add(type);
  }

  function setResetStep(step) {
    if (!resetModal) return;
    resetModal.querySelectorAll("[data-reset-step]").forEach((panel) => {
      panel.classList.toggle("hidden", panel.getAttribute("data-reset-step") !== step);
    });
  }

  function openResetModal(prefill) {
    if (!resetModal) return;
    resetModal.classList.remove("hidden");
    setResetStep("request");
    showResetMessage("");
    if (resetDevToken) {
      resetDevToken.classList.add("hidden");
      resetDevToken.textContent = "";
    }
    if (resetEmailInput && prefill) {
      resetEmailInput.value = prefill;
    }
    resetEmailInput && resetEmailInput.focus();
  }

  function closeResetModal() {
    if (!resetModal) return;
    resetModal.classList.add("hidden");
    showResetMessage("");
    pendingReset = false;
  }

  function setMessage(text, type) {
    if (!authMessage) return;
    authMessage.textContent = text || "";
    authMessage.classList.remove("error", "success");
    if (type) authMessage.classList.add(type);
  }

  function setLoading(isLoading) {
    if (signInBtn) signInBtn.disabled = isLoading;
    if (signUpBtn) signUpBtn.disabled = isLoading;
  }

  function getStoredSessionFrom(storage) {
    try {
      const raw = storage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const email = String(parsed?.email || "").trim();
      const username = String(parsed?.username || "").trim();
      const password = String(parsed?.password || "");
      if ((!email && !username) || !password) return null;
      return { email, username, password };
    } catch (_) {
      return null;
    }
  }

  function readStoredSession() {
    return getStoredSessionFrom(sessionStorage) || getStoredSessionFrom(localStorage);
  }

  function writeStoredSession(session, remember) {
    const email = String(session?.email || "").trim();
    const username = String(session?.username || "").trim();
    const password = String(session?.password || "");
    if ((!email && !username) || !password) return;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email, username, password }));
    } catch (_) {}
    try {
      if (remember) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ email, username, password }));
        localStorage.setItem(REMEMBER_KEY, "1");
      } else {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch (_) {}
  }

  function redirectToDashboard() {
    window.location.replace(DASHBOARD_PATH);
  }

  function getValue(input) {
    return String(input?.value || "").trim();
  }

  function handleAuth(mode) {
    const isSignup = mode === "signup";
    const identifier = getValue(isSignup ? signUpEmailInput : loginIdentifierInput);
    const password = getValue(isSignup ? signUpPasswordInput : loginPasswordInput);
    const name = isSignup ? getValue(signUpNameInput) : "";
    const username = isSignup ? getValue(signUpHandleInput) : "";

    if (!identifier || !password || (isSignup && (!name || !username))) {
      setMessage(
        isSignup
          ? "Enter your name, username, email, and password."
          : "Enter your email or username and password.",
        "error"
      );
      return;
    }

    if (!socket) {
      setMessage("Realtime client failed to load. Open Novyn from your server URL.", "error");
      return;
    }

    const isEmail = identifier.includes("@");
    pendingCredentials = {
      email: isSignup ? identifier : isEmail ? identifier : "",
      username: isSignup ? username : isEmail ? "" : identifier,
      password,
      name,
      mode,
    };
    setLoading(true);
    setMessage("");
    socket.emit("register", pendingCredentials);
  }

  function clearMessage() {
    if (!authMessage) return;
    authMessage.textContent = "";
    authMessage.classList.remove("error", "success");
  }

  if (loginIdentifierInput) {
    loginIdentifierInput.addEventListener("input", clearMessage);
    loginIdentifierInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleAuth("signin");
      }
    });
  }

  if (loginPasswordInput) {
    loginPasswordInput.addEventListener("input", clearMessage);
    loginPasswordInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleAuth("signin");
      }
    });
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (event) => {
      event.preventDefault();
      const identifier = getValue(loginIdentifierInput);
      openResetModal(identifier && identifier.includes("@") ? identifier : "");
    });
  }

  if (resetModal) {
    resetModal.querySelectorAll("[data-reset-close]").forEach((el) => {
      el.addEventListener("click", () => closeResetModal());
    });
  }

  if (resetRequestBtn) {
    resetRequestBtn.addEventListener("click", () => {
      if (pendingReset) return;
      const identifier = getValue(resetEmailInput);
      if (!identifier) {
        showResetMessage("Enter your email or username to continue.", "error");
        return;
      }
      if (!socket) {
        showResetMessage("Realtime client failed to load.", "error");
        return;
      }
      pendingReset = true;
      showResetMessage("Sending reset code...", "");
      socket.emit("request_password_reset", { identifier });
    });
  }

  if (resetConfirmBtn) {
    resetConfirmBtn.addEventListener("click", () => {
      if (pendingReset) return;
      const token = getValue(resetCodeInput);
      const nextPassword = getValue(resetNewPasswordInput);
      const confirmPassword = getValue(resetConfirmPasswordInput);
      if (!token || !nextPassword || !confirmPassword) {
        showResetMessage("Fill in the code and both password fields.", "error");
        return;
      }
      if (nextPassword !== confirmPassword) {
        showResetMessage("Passwords do not match.", "error");
        return;
      }
      if (!socket) {
        showResetMessage("Realtime client failed to load.", "error");
        return;
      }
      pendingReset = true;
      showResetMessage("Updating password...", "");
      socket.emit("reset_password", { token, newPassword: nextPassword });
    });
  }

  if (signUpNameInput) {
    signUpNameInput.addEventListener("input", clearMessage);
  }

  if (signUpHandleInput) {
    signUpHandleInput.addEventListener("input", clearMessage);
  }

  if (signUpEmailInput) {
    signUpEmailInput.addEventListener("input", clearMessage);
  }

  if (signUpPasswordInput) {
    signUpPasswordInput.addEventListener("input", clearMessage);
    signUpPasswordInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleAuth("signup");
      }
    });
  }

  if (signInBtn) {
    signInBtn.addEventListener("click", (event) => {
      event.preventDefault();
      handleAuth("signin");
    });
  }

  if (signUpBtn) {
    signUpBtn.addEventListener("click", (event) => {
      event.preventDefault();
      handleAuth("signup");
    });
  }

  const existingSession = readStoredSession();
  if (existingSession) {
    redirectToDashboard();
  }

  loadStats();
  setInterval(loadStats, 15000);

  if (socket) {
    socket.on("register_success", (data) => {
      const email = data?.email || pendingCredentials?.email;
      const username = data?.username || pendingCredentials?.username;
      const password = pendingCredentials?.password;
      const remember = Boolean(rememberCheckbox && rememberCheckbox.checked);
      pendingCredentials = null;
      if (password && (email || username)) writeStoredSession({ email, username, password }, remember);
      setLoading(false);
      setMessage("Signed in. Redirecting...", "success");
      redirectToDashboard();
    });

    socket.on("auth_failed", (data) => {
      pendingCredentials = null;
      setLoading(false);
      setMessage(data?.message || "Authentication failed.", "error");
    });

    socket.on("password_reset_sent", (data) => {
      pendingReset = false;
      setResetStep("confirm");
      showResetMessage(data?.message || "Reset code sent.", "success");
      if (resetDevToken && data?.token) {
        resetDevToken.textContent = `Reset code: ${data.token}`;
        resetDevToken.classList.remove("hidden");
      }
    });

    socket.on("password_reset_failed", (data) => {
      pendingReset = false;
      showResetMessage(data?.message || "Unable to reset password.", "error");
    });

    socket.on("password_reset_success", (data) => {
      pendingReset = false;
      showResetMessage(data?.message || "Password updated. Please sign in.", "success");
      setTimeout(() => closeResetModal(), 1200);
    });

    socket.on("error_message", (data) => {
      setLoading(false);
      setMessage(data?.message || "Something went wrong.", "error");
    });

    socket.on("connect_error", () => {
      if (pendingCredentials) {
        setLoading(false);
      }
      setMessage("Connection issue. Try again.", "error");
    });
  } else {
    setMessage("Realtime client failed to load. Open Novyn from your server URL.", "error");
  }
