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

let pendingCredentials = null;

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

function setLoginLoading(isLoading) {
  if (!loginBtn) return;
  loginBtn.disabled = isLoading;
  if (loginBtnText) loginBtnText.textContent = isLoading ? "Entering..." : "Sign In";
  if (loginBtnArrow) loginBtnArrow.classList.toggle("hidden", isLoading);
  if (loginBtnSpinner) loginBtnSpinner.classList.toggle("hidden", !isLoading);
}

const existingSession = readStoredSession();
if (existingSession) {
  redirectToDashboard();
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearUsernameSuggestions();

    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    if (!username || !password) return;

    pendingCredentials = { username, password };
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
  setLoginLoading(false);
  if (passwordInput) passwordInput.value = "";
  clearUsernameSuggestions();
  redirectToDashboard();
});

socket.on("username_unavailable", (data) => {
  pendingCredentials = null;
  setLoginLoading(false);
  showUsernameSuggestions(data?.requested || "This username", data?.suggestions || []);
  showToast("Username already taken.", "error");
});

socket.on("auth_failed", (data) => {
  pendingCredentials = null;
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

socket.on("connect", () => {
  setNetworkState("Connected", "connected");
  if (pendingCredentials) {
    socket.emit("register", pendingCredentials);
  }
});

socket.on("disconnect", () => {
  setNetworkState("Disconnected", "offline");
  if (pendingCredentials) setLoginLoading(false);
});

socket.on("connect_error", () => {
  setNetworkState("Connection issue", "offline");
});

if (!socketAvailable) {
  setNetworkState("Realtime unavailable", "offline");
  showToast("Realtime client failed to load. Open Novyn from your server URL.", "error");
}