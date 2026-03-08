import { createSocketClient } from './app/socket-client.js';
import { createLoginPage } from './pages/login/LoginPage.js';

const AUTH_SESSION_KEY = 'novyn-session';
const OFFLINE_SUBMIT_ERROR = 'You are offline. Reconnect and try again.';
const DISCONNECT_DURING_AUTH_ERROR = 'Connection lost while signing in. Try again once connected.';
const RECONNECT_HINT = 'Reconnecting to server...';

function readSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const username = String(parsed?.username || '').trim();
    const sessionToken = String(parsed?.sessionToken || '').trim();

    if (!username || !sessionToken) return null;
    return { username, sessionToken };
  } catch (_err) {
    return null;
  }
}

function saveSession(username, sessionToken) {
  const safeUsername = String(username || '').trim();
  const safeSessionToken = String(sessionToken || '').trim();
  if (!safeUsername || !safeSessionToken) return;

  try {
    localStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({ username: safeUsername, sessionToken: safeSessionToken })
    );
  } catch (_err) {
    // Ignore storage failures.
  }
}

function clearSession() {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
  } catch (_err) {
    // Ignore storage failures.
  }
}

function goChat() {
  window.location.replace('/');
}

function setConnectionUI(connected) {
  const pill = document.getElementById('networkPill');
  const label = document.getElementById('connectionLabel');

  if (!pill || !label) return;

  pill.classList.toggle('ok', connected);
  pill.classList.toggle('err', !connected);
  label.textContent = connected ? 'Connected' : 'Reconnecting...';
}

const socketClient = createSocketClient();
let authMode = '';

const loginPage = createLoginPage({
  async onSubmit(credentials) {
    const username = String(credentials?.username || '').trim();
    const password = String(credentials?.password || '');

    if (!username || !password) {
      loginPage.showError('Enter username and password.');
      return;
    }

    if (!socketClient.connected) {
      loginPage.showHint(RECONNECT_HINT);
      loginPage.showError(OFFLINE_SUBMIT_ERROR);
      return;
    }

    authMode = 'password';
    socketClient.emit('register', { username, password });
  },
});

function tryResumeSession() {
  const session = readSession();
  if (!session || !socketClient.connected) return false;

  authMode = 'session';
  loginPage.setLoading(true);
  socketClient.emit('resume_session', session);
  return true;
}

socketClient.on('connect', () => {
  setConnectionUI(true);
  loginPage.showHint('');
  tryResumeSession();
});

socketClient.on('disconnect', () => {
  setConnectionUI(false);
  loginPage.showHint(RECONNECT_HINT);

  if (authMode === 'password') {
    loginPage.setLoading(false);
    loginPage.showError(DISCONNECT_DURING_AUTH_ERROR);
    authMode = '';
  }
});

socketClient.on('connect_error', () => {
  setConnectionUI(false);
  loginPage.showHint(RECONNECT_HINT);
  loginPage.setLoading(false);
  if (authMode === 'password') {
    loginPage.showError(OFFLINE_SUBMIT_ERROR);
  }
});

socketClient.on('register_success', (payload) => {
  loginPage.setLoading(false);
  loginPage.clearError();
  loginPage.renderSuggestions([]);

  if (payload?.username && payload?.sessionToken) {
    saveSession(payload.username, payload.sessionToken);
  }

  goChat();
});

socketClient.on('auth_failed', (payload) => {
  loginPage.setLoading(false);

  if (payload?.code === 'session_invalid' || authMode === 'session') {
    clearSession();
  }

  authMode = '';

  loginPage.showError(payload?.message || 'Could not sign in.');
  loginPage.renderSuggestions(payload?.suggestions || []);
});

socketClient.on('error_message', (payload) => {
  loginPage.setLoading(false);
  loginPage.showError(payload?.message || 'Something went wrong.');
});

setConnectionUI(socketClient.connected);

if (socketClient.connected) {
  tryResumeSession();
}

window.__novynLogin = {
  socketClient,
  loginPage,
};
