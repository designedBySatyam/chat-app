import { createSidebar } from '../../components/sidebar.js';
import { createMessagesView } from '../../components/messages.js';
import { createComposer } from '../../components/composer.js';
import { createTypingBar } from '../../components/typing-bar.js';
import { createSmartReplies } from '../../components/smart-replies.js';
import { createToastController } from '../../components/toasts.js';
import { createProfileModal, createUnfriendModal } from '../../components/modals.js';
import {
  buildSmartReplies,
  polishDraft,
  answerInline,
  createAiConversation,
} from '../../ai/novyn-ai.js';

const AUTH_SESSION_KEY = 'novyn-session';
const TEMP_LOGIN_KEY = 'novyn-login-cache';

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

function getStatusLabel(online, lastSeenAt) {
  if (online) return 'Online';
  if (!lastSeenAt) return 'Offline';

  const dt = new Date(lastSeenAt);
  if (Number.isNaN(dt.getTime())) return 'Offline';

  return `Last seen ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

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
  const user = String(username || '').trim();
  const token = String(sessionToken || '').trim();
  if (!user || !token) return;

  try {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ username: user, sessionToken: token }));
  } catch (_err) {
    // Ignore storage errors.
  }
}

function clearSession() {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
  } catch (_err) {
    // Ignore storage errors.
  }
}

function saveTempLogin(username, password) {
  const user = String(username || '').trim();
  const pass = String(password || '');
  if (!user || !pass) return;

  try {
    sessionStorage.setItem(TEMP_LOGIN_KEY, JSON.stringify({ username: user, password: pass }));
  } catch (_err) {
    // Ignore storage errors.
  }
}

function readTempLogin() {
  try {
    const raw = sessionStorage.getItem(TEMP_LOGIN_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const username = String(parsed?.username || '').trim();
    const password = String(parsed?.password || '');

    if (!username || !password) return null;
    return { username, password };
  } catch (_err) {
    return null;
  }
}

function clearTempLogin() {
  try {
    sessionStorage.removeItem(TEMP_LOGIN_KEY);
  } catch (_err) {
    // Ignore storage errors.
  }
}

function setConnectionUI(connected) {
  const pill = document.getElementById('networkPill');
  const label = document.getElementById('connectionLabel');

  if (!pill || !label) return;

  pill.classList.toggle('ok', connected);
  pill.classList.toggle('err', !connected);
  label.textContent = connected ? 'Connected' : 'Offline';
}

function isMobile() {
  return window.innerWidth <= 768;
}

function showMobilePanel(panel) {
  const sidebar = document.getElementById('mobileSidebar');
  const chat = document.getElementById('mobileChat');

  if (!sidebar || !chat || !isMobile()) return;

  if (panel === 'chat') {
    sidebar.setAttribute('data-mob-hidden', 'true');
    chat.removeAttribute('data-mob-hidden');
    return;
  }

  chat.setAttribute('data-mob-hidden', 'true');
  sidebar.removeAttribute('data-mob-hidden');
}

export function createChatPage({ store, socketClient, loginPage }) {
  const toast = createToastController();
  const typingBar = createTypingBar();
  const aiConversation = createAiConversation();

  const state = {
    me: '',
    profile: {
      avatarId: '',
      displayName: '',
      bio: '',
      age: '',
      gender: '',
    },
    friends: [],
    requests: [],
    activeFriend: '',
    aiMode: false,
    conversations: new Map(),
    aiMessages: [],
    authMode: '',
  };

  const messagesView = createMessagesView({
    onReply(replyPayload) {
      composer.setReply(replyPayload);
      composer.focus();
    },
    onReact(message, emoji) {
      if (state.aiMode || !state.activeFriend) return;
      socketClient.emit('react', {
        messageId: message.id,
        emoji,
        to: state.activeFriend,
      });
    },
    onDelete(message) {
      if (state.aiMode || !state.activeFriend) return;
      socketClient.emit('delete_message', {
        messageId: message.id,
        to: state.activeFriend,
      });
    },
  });

  const smartReplies = createSmartReplies({
    onSelect(reply) {
      composer.setText(reply);
      composer.focus();
      smartReplies.hide();
    },
  });

  const profileModal = createProfileModal({
    onSave(payload) {
      socketClient.emit('update_profile', payload);
    },
  });

  const unfriendModal = createUnfriendModal();

  const sidebar = createSidebar({
    onSelectFriend(username) {
      openFriendChat(username);
    },
    onSelectAi() {
      openAiChat();
    },
    onAddFriend(username) {
      if (!state.me) return;
      socketClient.emit('add_friend', username);
    },
    onAcceptRequest(username) {
      socketClient.emit('accept_friend', username);
    },
    onLogout() {
      clearSession();
      clearTempLogin();
      window.location.replace('/login.html');
    },
    onOpenProfile() {
      profileModal.open(state.profile);
    },
  });

  const composer = createComposer({
    async onSubmit(text, replyTo) {
      if (!state.me) return false;

      if (state.aiMode) {
        sendAiMessage(text);
        return true;
      }

      if (!state.activeFriend) {
        toast.show('Select a friend first.', 'err');
        return false;
      }

      if (text.toLowerCase().startsWith('@novyn ')) {
        const query = text.slice(7).trim();
        if (!query) {
          toast.show('Add a question after @novyn.', 'err');
          return false;
        }

        composer.setBusy(true);
        const answer = await answerInline(query);
        composer.setBusy(false);

        if (!answer) {
          toast.show('AI is unavailable right now.', 'err');
          return false;
        }

        socketClient.emit('private_message', {
          to: state.activeFriend,
          text: answer,
          ...(replyTo ? { replyTo } : {}),
        });

        return true;
      }

      socketClient.emit('private_message', {
        to: state.activeFriend,
        text,
        ...(replyTo ? { replyTo } : {}),
      });

      return true;
    },
    onTyping(isTyping) {
      if (state.aiMode || !state.activeFriend) return;
      socketClient.emit('typing', {
        to: state.activeFriend,
        isTyping: Boolean(isTyping),
      });
    },
    onPolish(text) {
      return polishDraft(text);
    },
  });

  const removeFriendBtn = document.getElementById('removeFriendBtn');
  if (removeFriendBtn) {
    removeFriendBtn.addEventListener('click', async () => {
      if (!state.activeFriend || state.aiMode) return;

      const confirmed = await unfriendModal.open(state.activeFriend);
      if (!confirmed) return;

      socketClient.emit('remove_friend', state.activeFriend);
    });
  }

  const backBtn = document.getElementById('mobBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      showMobilePanel('friends');
    });
  }

  const searchToggle = document.getElementById('messageSearchToggle');
  const searchPanel = document.getElementById('messageSearchPanel');
  const searchInput = document.getElementById('messageSearchInput');
  const searchClear = document.getElementById('messageSearchClear');
  const searchCount = document.getElementById('messageSearchCount');

  let searchOpen = false;

  function applySearch() {
    if (!searchInput || !searchCount) return;

    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      searchCount.classList.add('hidden');
      searchCount.textContent = '';
      renderActiveConversation();
      return;
    }

    const source = state.aiMode
      ? state.aiMessages
      : state.conversations.get(normalizeKey(state.activeFriend)) || [];

    const filtered = source.filter((message) =>
      String(message.text || '').toLowerCase().includes(query)
    );

    messagesView.setContext({ me: state.me, activeFriend: state.activeFriend });
    messagesView.setMessages(filtered, { preserveScroll: true });

    searchCount.classList.remove('hidden');
    searchCount.textContent = `${filtered.length} match${filtered.length === 1 ? '' : 'es'}`;
  }

  if (searchToggle && searchPanel) {
    searchToggle.addEventListener('click', () => {
      searchOpen = !searchOpen;
      searchPanel.classList.toggle('hidden', !searchOpen);
      searchToggle.setAttribute('aria-expanded', String(searchOpen));
      if (searchOpen) {
        searchInput?.focus();
      } else {
        if (searchInput) searchInput.value = '';
        applySearch();
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', applySearch);
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (!searchInput) return;
      searchInput.value = '';
      applySearch();
      searchInput.focus();
    });
  }

  function updateMeUI() {
    const meName = document.getElementById('meName');
    const meAvatar = document.getElementById('meAvatar');

    if (meName) {
      meName.textContent = state.profile.displayName || state.me || 'Me';
    }

    if (meAvatar) {
      const initial = (state.profile.displayName || state.me || '?').slice(0, 2).toUpperCase();
      profileModal.applyAvatar(meAvatar, state.profile.avatarId, initial);
    }
  }

  function setHeaderForFriend(friend) {
    const label = document.getElementById('activeFriendLabel');
    const presence = document.getElementById('activePresence');
    const presenceLine = document.getElementById('activeFriendPresenceLine');
    const avatar = document.getElementById('activeFriendAvatar');

    if (!friend) {
      if (label) label.textContent = 'Select a friend';
      if (presence) presence.textContent = '';
      if (presenceLine) presenceLine.className = 'ch-pres';
      if (avatar) {
        avatar.className = 'ch-av';
        avatar.textContent = '?';
      }
      if (removeFriendBtn) removeFriendBtn.style.display = 'none';
      return;
    }

    if (label) label.textContent = friend.displayName || friend.username;
    if (presence) presence.textContent = getStatusLabel(friend.online, friend.lastSeenAt);
    if (presenceLine) {
      presenceLine.className = `ch-pres${friend.online ? ' on' : ''}`;
    }

    if (avatar) {
      avatar.className = `ch-av${friend.online ? ' on' : ''}`;
      const initial = (friend.displayName || friend.username || '?').slice(0, 2).toUpperCase();
      avatar.textContent = initial;
    }

    if (removeFriendBtn) removeFriendBtn.style.display = 'inline-flex';
  }

  function setHeaderForAi() {
    const label = document.getElementById('activeFriendLabel');
    const presence = document.getElementById('activePresence');
    const presenceLine = document.getElementById('activeFriendPresenceLine');
    const avatar = document.getElementById('activeFriendAvatar');

    if (label) label.textContent = 'Novyn AI';
    if (presence) presence.textContent = 'AI · always online';
    if (presenceLine) presenceLine.className = 'ch-pres ai-p';
    if (avatar) {
      avatar.className = 'ch-av ai-av2';
      avatar.textContent = '✦';
    }

    if (removeFriendBtn) removeFriendBtn.style.display = 'none';
  }

  function getConversation(friendName) {
    return state.conversations.get(normalizeKey(friendName)) || [];
  }

  function setConversation(friendName, messages) {
    state.conversations.set(normalizeKey(friendName), Array.isArray(messages) ? [...messages] : []);
  }

  function upsertConversationMessage(friendName, message) {
    const key = normalizeKey(friendName);
    const list = state.conversations.get(key) || [];
    const idx = list.findIndex((item) => item.id === message.id);

    if (idx >= 0) {
      list[idx] = { ...list[idx], ...message };
    } else {
      list.push(message);
    }

    state.conversations.set(key, list);
  }

  function patchConversationMessage(friendName, messageId, partial) {
    const key = normalizeKey(friendName);
    const list = state.conversations.get(key) || [];
    const idx = list.findIndex((item) => item.id === messageId);
    if (idx < 0) return;

    list[idx] = { ...list[idx], ...(partial || {}) };
    state.conversations.set(key, list);
  }

  function renderActiveConversation() {
    if (searchInput && searchInput.value.trim()) {
      applySearch();
      return;
    }

    if (state.aiMode) {
      messagesView.setContext({ me: state.me, activeFriend: 'Novyn AI' });
      messagesView.setMessages(state.aiMessages, { preserveScroll: true });
      return;
    }

    if (!state.activeFriend) {
      messagesView.clear();
      return;
    }

    const list = getConversation(state.activeFriend);
    messagesView.setContext({ me: state.me, activeFriend: state.activeFriend });
    messagesView.setMessages(list, { preserveScroll: true });
  }

  async function suggestRepliesForIncoming(incomingText) {
    if (state.aiMode || !state.activeFriend) return;

    const conversation = getConversation(state.activeFriend);
    const contextLines = conversation
      .slice(-6)
      .map((item) => `${item.from || '?'}: ${item.text || ''}`);

    smartReplies.showLoading();

    const replies = await buildSmartReplies({
      incomingText,
      contextLines,
    });

    if (state.aiMode) return;
    smartReplies.show(replies);
  }

  function ensureAiGreeting() {
    if (state.aiMessages.length) return;

    state.aiMessages.push({
      id: `ai-greet-${Date.now()}`,
      from: 'Novyn AI',
      to: state.me,
      text: 'Hey. I am Novyn AI. Ask me anything.',
      timestamp: nowIso(),
      ai: true,
    });
  }

  async function sendAiMessage(text) {
    const clean = String(text || '').trim();
    if (!clean) return;

    state.aiMessages.push({
      id: `ai-user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      from: state.me,
      to: 'Novyn AI',
      text: clean,
      timestamp: nowIso(),
      ai: false,
    });
    renderActiveConversation();

    smartReplies.hide();
    typingBar.show('Novyn AI is thinking...');
    composer.setBusy(true);

    const reply = await aiConversation.send(clean);

    composer.setBusy(false);
    typingBar.hide();

    state.aiMessages.push({
      id: `ai-reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      from: 'Novyn AI',
      to: state.me,
      text: reply,
      timestamp: nowIso(),
      ai: true,
    });

    renderActiveConversation();

    const replies = await buildSmartReplies({
      incomingText: reply,
      contextLines: state.aiMessages.slice(-6).map((msg) => `${msg.from}: ${msg.text}`),
    });
    smartReplies.show(replies);
  }

  function openFriendChat(friendName) {
    const friend = state.friends.find((item) => item.username === friendName);
    if (!friend) return;

    state.aiMode = false;
    state.activeFriend = friend.username;

    sidebar.setAiMode(false);
    sidebar.setActiveFriend(friend.username);

    setHeaderForFriend(friend);
    composer.setEnabled(true);
    composer.setPlaceholder(`Message ${friend.displayName || friend.username}...`);
    composer.clear();
    composer.focus();
    smartReplies.hide();
    typingBar.hide();

    socketClient.emit('get_history', friend.username);

    showMobilePanel('chat');
  }

  function openAiChat() {
    state.aiMode = true;
    state.activeFriend = '';

    sidebar.setAiMode(true);
    setHeaderForAi();

    composer.setEnabled(true);
    composer.setPlaceholder('Message Novyn AI...');
    composer.clear();
    composer.focus();

    typingBar.hide();
    ensureAiGreeting();
    renderActiveConversation();

    smartReplies.hide();
    showMobilePanel('chat');
  }

  function resetChatSelection() {
    state.activeFriend = '';
    state.aiMode = false;

    sidebar.setAiMode(false);
    sidebar.setActiveFriend('');
    setHeaderForFriend(null);

    composer.clear();
    composer.setEnabled(false);
    composer.setPlaceholder('Select a friend to start chatting');
    smartReplies.hide();
    typingBar.hide();
    messagesView.clear();
  }

  function applyFriendList(friends) {
    state.friends = Array.isArray(friends) ? [...friends] : [];
    sidebar.setFriends(state.friends);

    if (state.aiMode) return;

    if (!state.activeFriend) {
      setHeaderForFriend(null);
      return;
    }

    const active = state.friends.find((item) => item.username === state.activeFriend);
    if (!active) {
      toast.show('Active friend removed from your list.', 'err');
      resetChatSelection();
      return;
    }

    setHeaderForFriend(active);
  }

  function applyRequests(requests) {
    state.requests = Array.isArray(requests) ? [...requests] : [];
    sidebar.setRequests(state.requests);
  }

  function markAuthenticated(payload) {
    state.me = payload.username;
    state.profile = {
      ...state.profile,
      ...(payload.profile || {}),
    };

    if (payload.sessionToken) {
      saveSession(payload.username, payload.sessionToken);
    }

    clearTempLogin();
    state.authMode = '';

    updateMeUI();
    applyFriendList(payload.friends || []);
    applyRequests(payload.requests || []);

    store.patch({ route: 'chat', me: payload.username });
    loginPage.clearError();

    if (isMobile()) {
      showMobilePanel('friends');
    }

    if (state.aiMode) {
      openAiChat();
    } else if (state.activeFriend) {
      openFriendChat(state.activeFriend);
    } else {
      resetChatSelection();
    }

    toast.show(`Welcome ${payload.username}`, 'ok');
  }

  function attemptSessionResume() {
    const session = readSession();
    if (!session) return false;
    if (!socketClient.connected) return false;

    state.authMode = 'session';
    loginPage.setLoading(true);
    socketClient.emit('resume_session', session);
    return true;
  }

  function attemptCachedPasswordLogin() {
    const cached = readTempLogin();
    if (!cached) return false;
    if (!socketClient.connected) return false;

    state.authMode = 'cached_password';
    loginPage.setCredentials(cached);
    loginPage.setLoading(true);
    socketClient.emit('register', cached);
    return true;
  }

  function bindSocketEvents() {
    socketClient.on('connect', () => {
      setConnectionUI(true);
      attemptSessionResume() || attemptCachedPasswordLogin();
    });

    socketClient.on('disconnect', () => {
      setConnectionUI(false);
      typingBar.hide();
    });

    socketClient.on('register_success', (payload) => {
      loginPage.setLoading(false);
      markAuthenticated(payload || {});
    });

    socketClient.on('auth_failed', (payload) => {
      loginPage.setLoading(false);

      const message = String(payload?.message || 'Could not sign in').trim();
      const suggestions = Array.isArray(payload?.suggestions) ? payload.suggestions : [];

      if (payload?.code === 'session_invalid' || state.authMode === 'session') {
        clearSession();
        window.location.replace('/login.html');
        return;
      }

      loginPage.showError(message);
      loginPage.renderSuggestions(suggestions);
      state.authMode = '';

      store.set('route', 'login');
    });

    socketClient.on('friend_list_updated', (payload) => {
      applyFriendList(payload?.friends || []);
    });

    socketClient.on('requests_updated', (payload) => {
      applyRequests(payload?.requests || []);
    });

    socketClient.on('friend_request_received', (payload) => {
      toast.show(`${payload?.from || 'Someone'} sent you a friend request`, 'ok');
    });

    socketClient.on('friend_request_sent', (payload) => {
      toast.show(`Request sent to ${payload?.to || 'friend'}`, 'ok');
    });

    socketClient.on('friend_request_accepted', (payload) => {
      toast.show(`${payload?.by || 'Friend'} accepted your request`, 'ok');
    });

    socketClient.on('friend_removed', (payload) => {
      const username = String(payload?.username || '').trim();
      if (username && username === state.activeFriend) {
        resetChatSelection();
      }
      toast.show(`${username || 'Friend'} removed`, 'err');
    });

    socketClient.on('history', (payload) => {
      const friendName = String(payload?.with || '').trim();
      if (!friendName) return;

      setConversation(friendName, payload?.messages || []);

      if (!state.aiMode && state.activeFriend === friendName) {
        renderActiveConversation();
        smartReplies.hide();
      }
    });

    socketClient.on('private_message', (message) => {
      if (!message || !message.id) return;

      const friendName = normalizeKey(message.from) === normalizeKey(state.me)
        ? message.to
        : message.from;

      if (!friendName) return;

      upsertConversationMessage(friendName, message);

      if (!state.aiMode && normalizeKey(state.activeFriend) === normalizeKey(friendName)) {
        renderActiveConversation();

        if (normalizeKey(message.from) !== normalizeKey(state.me)) {
          suggestRepliesForIncoming(message.text || '');
        }
      }
    });

    socketClient.on('typing', (payload) => {
      if (state.aiMode || !state.activeFriend) return;

      const from = String(payload?.from || '').trim();
      if (normalizeKey(from) !== normalizeKey(state.activeFriend)) return;

      if (payload?.isTyping) {
        typingBar.show(`${from} is typing...`);
      } else {
        typingBar.hide();
      }
    });

    socketClient.on('user_status', (payload) => {
      const username = String(payload?.username || '').trim();
      if (!username) return;

      state.friends = state.friends.map((friend) => {
        if (friend.username !== username) return friend;
        return {
          ...friend,
          online: Boolean(payload.online),
          lastSeenAt: payload.lastSeenAt || friend.lastSeenAt,
        };
      });

      sidebar.setFriends(state.friends);

      if (!state.aiMode && state.activeFriend === username) {
        const active = state.friends.find((friend) => friend.username === username);
        setHeaderForFriend(active || null);
      }
    });

    socketClient.on('message_status', (payload) => {
      const friendName = String(payload?.with || '').trim();
      const messageId = String(payload?.id || '').trim();
      if (!friendName || !messageId) return;

      patchConversationMessage(friendName, messageId, {
        deliveredAt: payload.deliveredAt || null,
        seenAt: payload.seenAt || null,
      });

      if (!state.aiMode && normalizeKey(state.activeFriend) === normalizeKey(friendName)) {
        renderActiveConversation();
      }
    });

    socketClient.on('reaction_updated', (payload) => {
      const messageId = String(payload?.messageId || '').trim();
      if (!messageId || !state.activeFriend || state.aiMode) return;

      patchConversationMessage(state.activeFriend, messageId, {
        reactions: payload.reactions || {},
      });

      renderActiveConversation();
    });

    socketClient.on('message_deleted', (payload) => {
      const friendName = String(payload?.with || '').trim();
      const messageId = String(payload?.messageId || '').trim();
      if (!friendName || !messageId) return;

      patchConversationMessage(friendName, messageId, {
        text: payload.text || 'This message was deleted.',
        deletedAt: payload.deletedAt || nowIso(),
        reactions: {},
      });

      if (!state.aiMode && normalizeKey(state.activeFriend) === normalizeKey(friendName)) {
        renderActiveConversation();
      }
    });

    socketClient.on('profile_updated', (payload) => {
      state.profile = {
        ...state.profile,
        ...(payload || {}),
      };
      updateMeUI();
      toast.show('Profile updated', 'ok');
    });

    socketClient.on('friend_profile_updated', (payload) => {
      const username = String(payload?.username || '').trim();
      if (!username) return;

      state.friends = state.friends.map((friend) => {
        if (friend.username !== username) return friend;

        return {
          ...friend,
          displayName: payload.displayName || friend.displayName,
          bio: payload.bio || friend.bio,
          avatarId: payload.avatarId || friend.avatarId,
        };
      });

      sidebar.setFriends(state.friends);
    });

    socketClient.on('error_message', (payload) => {
      toast.show(payload?.message || 'Action failed', 'err');
    });
  }

  async function register(credentials) {
    if (!socketClient.socket) {
      loginPage.showError('Realtime client unavailable.');
      return;
    }

    const username = String(credentials?.username || '').trim();
    const password = String(credentials?.password || '');

    if (!username || !password) {
      loginPage.showError('Enter username and password.');
      return;
    }

    saveTempLogin(username, password);

    state.authMode = 'password';
    socketClient.emit('register', {
      username,
      password,
    });
  }

  function start() {
    composer.setEnabled(false);
    composer.setPlaceholder('Select a friend to start chatting');
    resetChatSelection();

    bindSocketEvents();

    if (!socketClient.socket) {
      setConnectionUI(false);
      loginPage.showError('Socket client unavailable.');
      return;
    }

    if (socketClient.connected) {
      setConnectionUI(true);
      attemptSessionResume() || attemptCachedPasswordLogin();
    } else {
      setConnectionUI(false);
    }
  }

  return {
    start,
    register,
    openAiChat,
  };
}
