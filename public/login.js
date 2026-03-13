const socketAvailable = typeof io === "function";
const SOCKET_URL = window.location.origin.replace(/\/$/, "");
const socket = socketAvailable ? io(SOCKET_URL) : { on() {}, emit() {}, connected: false };

const SESSION_KEY = "novyn-session";
const DASHBOARD_PATH = "/index.html";

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const usernameHint = document.getElementById("usernameHint");
const usernameSuggestions = document.getElementById("usernameSuggestions");
const loginBtn = document.getElementById("loginBtn");
const loginBtnText = loginBtn ? loginBtn.querySelector(".login-btn-text") : null;
const loginBtnArrow = loginBtn ? loginBtn.querySelector(".login-btn-arrow") : null;
const loginBtnSpinner = loginBtn ? loginBtn.querySelector(".login-btn-spinner") : null;
const connectionLabel = document.getElementById("connectionLabel");
const networkPill = document.getElementById("networkPill");
const toast = document.getElementById("toast");
const authTabs = document.querySelectorAll("[data-auth-tab]");
const signupFields = document.getElementById("signupFields");
const genderGroup = document.getElementById("genderGroup");
const fullNameInput = document.getElementById("fullNameInput");
const ageInput = document.getElementById("ageInput");
const genderInput = document.getElementById("genderInput");
const genderButtons = document.querySelectorAll("[data-gender]");
const authHeadline = document.getElementById("authHeadline");
const authSubhead = document.getElementById("authSubhead");
const forgotLink = document.getElementById("forgotLink");
const authPanel = document.querySelector(".auth-right-inner");
const themeToggle = document.getElementById("themeToggle");
const THEME_KEY = "novyn-theme";
const themeMedia = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;
let currentThemeMode = "dark";

let pendingCredentials = null;
let pendingProfile = null;
let pendingProfileUpdate = false;
let authMode = "signin";
let authSwitchReady = false;
let authSwitchTimer = null;

function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch (_) {
    return null;
  }
}

function storeTheme(mode) {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch (_) {
    // Ignore storage failures.
  }
}

function resolveTheme(mode) {
  if (mode === "system") {
    return themeMedia && themeMedia.matches ? "light" : "dark";
  }
  return mode;
}

function applyTheme(mode) {
  currentThemeMode = mode;
  const resolved = resolveTheme(mode);
  const isLight = resolved === "light";
  document.documentElement.classList.toggle("light", isLight);
  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", isLight ? "true" : "false");
  }
}

const savedTheme = readStoredTheme();
if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
  applyTheme(savedTheme);
} else {
  applyTheme("system");
}

if (themeMedia) {
  const handler = () => {
    if (currentThemeMode === "system") applyTheme("system");
  };
  if (typeof themeMedia.addEventListener === "function") {
    themeMedia.addEventListener("change", handler);
  } else if (typeof themeMedia.addListener === "function") {
    themeMedia.addListener(handler);
  }
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const resolved = resolveTheme(currentThemeMode);
    const next = resolved === "light" ? "dark" : "light";
    applyTheme(next);
    storeTheme(next);
  });
}

function triggerAuthTransition(direction) {
  if (!authPanel) return;
  authPanel.style.setProperty("--swap-dir", direction === 1 ? "1" : "-1");
  authPanel.classList.remove("is-switching");
  void authPanel.offsetWidth;
  authPanel.classList.add("is-switching");
  clearTimeout(authSwitchTimer);
  authSwitchTimer = setTimeout(() => {
    authPanel.classList.remove("is-switching");
  }, 360);
}

function readStoredSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const username = String(parsed?.username || "").trim();
    const password = String(parsed?.password || "");
    if (!username || !password) return null;
    return { username, password };
  } catch (_) {
    return null;
  }
}

function writeStoredSession(session) {
  const username = String(session?.username || "").trim();
  const password = String(session?.password || "");
  if (!username || !password) return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username, password }));
  } catch (_) {
    // Ignore storage failures.
  }
}

function clearStoredSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (_) {
    // Ignore storage failures.
  }
}

function redirectToDashboard() {
  window.location.replace(DASHBOARD_PATH);
}

function setNetworkState(label, state) {
  if (!connectionLabel || !networkPill) return;
  connectionLabel.textContent = label;
  networkPill.classList.remove("connected", "offline");
  if (state === "connected") networkPill.classList.add("connected");
  if (state === "offline") networkPill.classList.add("offline");
}

function showToast(message, type = "info") {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden", "error", "success");
  if (type === "error") toast.classList.add("error");
  if (type === "success") toast.classList.add("success");

  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2800);
}

function isEmptyProfile(profile) {
  if (!profile) return true;
  return !profile.displayName && !profile.age && !profile.gender && !profile.bio && !profile.avatarId;
}

function getSubmitLabel() {
  return authMode === "signup" ? "Create Account" : "Sign In";
}

function getLoadingLabel() {
  return authMode === "signup" ? "Creating..." : "Entering...";
}

function setAuthMode(mode) {
  const nextMode = mode === "signup" ? "signup" : "signin";
  const prevMode = authMode;
  authMode = nextMode;
  authTabs.forEach((btn) => {
    const isActive = btn.dataset.authTab === authMode;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  if (signupFields) signupFields.setAttribute("aria-hidden", authMode !== "signup");
  if (genderGroup) genderGroup.setAttribute("aria-hidden", authMode !== "signup");
  if (forgotLink) forgotLink.style.display = authMode === "signin" ? "" : "none";
  if (authHeadline) authHeadline.textContent = authMode === "signup" ? "Join Novyn" : "Welcome back";
  if (authSubhead) {
    authSubhead.textContent =
      authMode === "signup"
        ? "Create your account and start chatting."
        : "Sign in to continue your conversations.";
  }
  if (loginBtnText && !loginBtn?.disabled) loginBtnText.textContent = getSubmitLabel();
  if (passwordInput) {
    passwordInput.autocomplete = authMode === "signup" ? "new-password" : "current-password";
  }

  if (authSwitchReady && prevMode !== authMode) {
    triggerAuthTransition(authMode === "signup" ? 1 : -1);
  }
  authSwitchReady = true;
}

function setLoginLoading(isLoading) {
  if (!loginBtn) return;
  loginBtn.disabled = isLoading;
  if (loginBtnText) loginBtnText.textContent = isLoading ? getLoadingLabel() : getSubmitLabel();
  if (loginBtnArrow) loginBtnArrow.classList.toggle("hidden", isLoading);
  if (loginBtnSpinner) loginBtnSpinner.classList.toggle("hidden", !isLoading);
}

function finalizeAuth() {
  setLoginLoading(false);
  if (passwordInput) passwordInput.value = "";
  clearUsernameSuggestions();
  redirectToDashboard();
}

function clearUsernameSuggestions() {
  if (!usernameHint || !usernameSuggestions) return;
  usernameHint.textContent = "";
  usernameHint.classList.add("hidden");
  usernameSuggestions.innerHTML = "";
  usernameSuggestions.classList.add("hidden");
}

function showUsernameSuggestions(requested, suggestions) {
  if (!usernameHint || !usernameSuggestions || !usernameInput) return;
  const list = Array.isArray(suggestions) ? suggestions.slice(0, 6) : [];

  usernameHint.textContent = `"${requested}" is taken. Try one of these:`;
  usernameHint.classList.remove("hidden");
  usernameSuggestions.innerHTML = "";

  for (const suggestion of list) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-chip";
    button.textContent = suggestion;
    button.addEventListener("click", () => {
      usernameInput.value = suggestion;
      usernameInput.focus();
      clearUsernameSuggestions();
    });
    usernameSuggestions.appendChild(button);
  }

  usernameSuggestions.classList.toggle("hidden", list.length === 0);
}

const existingSession = readStoredSession();
if (existingSession) {
  redirectToDashboard();
}

authTabs.forEach((btn) => {
  btn.addEventListener("click", () => setAuthMode(btn.dataset.authTab));
});

genderButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    genderButtons.forEach((item) => {
      item.classList.remove("is-active");
      item.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("is-active");
    btn.setAttribute("aria-pressed", "true");
    if (genderInput) genderInput.value = btn.dataset.gender || "";
  });
});

setAuthMode(authMode);

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearUsernameSuggestions();

    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    if (!username || !password) return;

    pendingCredentials = { username, password };
    pendingProfile = null;
    if (authMode === "signup") {
      const displayName = fullNameInput ? fullNameInput.value.trim() : "";
      const age = ageInput ? String(ageInput.value || "").trim() : "";
      const gender = genderInput ? String(genderInput.value || "").trim() : "";
      if (displayName || age || gender) {
        pendingProfile = { displayName, age, gender };
      }
    }
    setLoginLoading(true);
    socket.emit("register", pendingCredentials);
  });
}

if (usernameInput) usernameInput.addEventListener("input", clearUsernameSuggestions);
if (passwordInput) passwordInput.addEventListener("input", clearUsernameSuggestions);

socket.on("register_success", (data) => {
  const session = pendingCredentials || readStoredSession();
  if (session?.password) {
    writeStoredSession({ username: data.username, password: session.password });
  }
  pendingCredentials = null;

  const shouldApplyProfile =
    authMode === "signup" && pendingProfile && isEmptyProfile(data?.profile);

  if (shouldApplyProfile) {
    pendingProfileUpdate = true;
    socket.emit("update_profile", pendingProfile);
    pendingProfile = null;
    // Wait for profile_updated before redirecting.
    return;
  }

  pendingProfile = null;
  finalizeAuth();
});

socket.on("username_unavailable", (data) => {
  pendingCredentials = null;
  setLoginLoading(false);
  showUsernameSuggestions(data?.requested || "This username", data?.suggestions || []);
  showToast("Username already taken.", "error");
});

socket.on("auth_failed", (data) => {
  pendingCredentials = null;
  pendingProfile = null;
  pendingProfileUpdate = false;
  clearStoredSession();
  setLoginLoading(false);
  clearUsernameSuggestions();
  if (Array.isArray(data?.suggestions) && data.suggestions.length) {
    showUsernameSuggestions(usernameInput ? usernameInput.value.trim() || "This username" : "This username", data.suggestions);
  }
  showToast(data?.message || "Authentication failed.", "error");
});

socket.on("error_message", (data) => {
  showToast(data?.message || "Something went wrong.", "error");
});

socket.on("profile_updated", () => {
  if (!pendingProfileUpdate) return;
  pendingProfileUpdate = false;
  finalizeAuth();
});

socket.on("connect", () => {
  setNetworkState("Connected", "connected");
  if (pendingCredentials) {
    socket.emit("register", pendingCredentials);
  }
});

socket.on("disconnect", () => {
  setNetworkState("Disconnected", "offline");
  if (pendingCredentials) setLoginLoading(false);
  pendingProfileUpdate = false;
});

socket.on("connect_error", () => {
  setNetworkState("Connection issue", "offline");
});

if (!socketAvailable) {
  setNetworkState("Realtime unavailable", "offline");
  showToast("Realtime client failed to load. Open Novyn from your server URL.", "error");
}

if (forgotLink) {
  forgotLink.addEventListener("click", () => {
    showToast("Password recovery is not available yet.", "info");
  });
}
