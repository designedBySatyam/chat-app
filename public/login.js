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
  const DASHBOARD_PATH = "/index.html";
  const socketAvailable = typeof io === "function";
  const SOCKET_URL = window.location.origin.replace(/\/$/, "");
  const socket = socketAvailable ? io(SOCKET_URL) : null;

  const loginIdentifierInput = document.getElementById("loginIdentifier");
  const loginPasswordInput = document.getElementById("pw1");
  const signInBtn = document.getElementById("signInBtn");

  const signUpEmailInput = document.getElementById("signupEmail");
  const signUpPasswordInput = document.getElementById("pw2");
  const signUpBtn = document.getElementById("signUpBtn");

  const authMessage = document.getElementById("authMessage");

  let pendingCredentials = null;

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

    if (!identifier || !password) {
      setMessage("Enter your email/username and password.", "error");
      return;
    }

    if (!socket) {
      setMessage("Realtime client failed to load. Open Novyn from your server URL.", "error");
      return;
    }

    pendingCredentials = { username: identifier, password };
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

  if (socket) {
    socket.on("register_success", (data) => {
      const username = data?.username || pendingCredentials?.username;
      const password = pendingCredentials?.password;
      pendingCredentials = null;
      if (username && password) writeStoredSession({ username, password });
      setLoading(false);
      setMessage("Signed in. Redirecting...", "success");
      redirectToDashboard();
    });

    socket.on("auth_failed", (data) => {
      pendingCredentials = null;
      setLoading(false);
      setMessage(data?.message || "Authentication failed.", "error");
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
