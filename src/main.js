import { createAppStore } from './app/store.js';
import { initRouter } from './app/router.js';
import { createSocketClient } from './app/socket-client.js';
import { createLoginPage } from './pages/login/LoginPage.js';
import { createChatPage } from './pages/chat/ChatPage.js';

const AUTH_SESSION_KEY = 'novyn-session';

function hasSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(String(parsed?.username || '').trim() && String(parsed?.sessionToken || '').trim());
  } catch (_err) {
    return false;
  }
}

if (!hasSession()) {
  window.location.replace('/login.html');
} else {
  const store = createAppStore({ route: 'chat' });
  const socketClient = createSocketClient();

  initRouter({ store });

  const loginPage = createLoginPage({
    async onSubmit(credentials) {
      chatPage.register(credentials);
    },
  });

  const chatPage = createChatPage({
    store,
    socketClient,
    loginPage,
  });

  chatPage.start();

  window.__novynModular = {
    store,
    socketClient,
    chatPage,
  };
}
