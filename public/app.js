const socketAvailable = typeof io === "function";
const SOCKET_URL = window.location.origin.replace(/\/$/, "");
const socket = socketAvailable ? io(SOCKET_URL) : { on() {}, emit() {}, connected: false };

const loginCard         = document.getElementById("loginCard");
const chatLayout        = document.getElementById("chatLayout");
const loginForm         = document.getElementById("loginForm");
const usernameInput     = document.getElementById("usernameInput");
const passwordInput     = document.getElementById("passwordInput");
const usernameHint      = document.getElementById("usernameHint");
const usernameSuggestions = document.getElementById("usernameSuggestions");
const meName            = document.getElementById("meName");
const addFriendForm     = document.getElementById("addFriendForm");
const friendInput       = document.getElementById("friendInput");
const friendSuggestions = document.getElementById("friendSuggestions");
const chatLists         = document.querySelectorAll(".chat-list");
const requestList       = document.getElementById("requestList") || chatLists[0] || null;
const friendList        = document.getElementById("friendList") || chatLists[1] || null;
const sidebarSearch     = document.getElementById("sidebarSearch");
const activeFriendLabel = document.getElementById("activeFriendLabel");
const activeFriendPresenceLine = document.getElementById("activeFriendPresenceLine");
const activePresence    = document.getElementById("activePresence");
const activeFriendAvatar = document.getElementById("activeFriendAvatar");
const profilePanel      = document.getElementById("profilePanel");
const profilePanelAvatar = document.getElementById("profilePanelAvatar");
const profilePanelName  = document.getElementById("profilePanelName");
const profilePanelHandle = document.getElementById("profilePanelHandle");
const profilePanelStatus = document.getElementById("profilePanelStatus");
const profileStatMessages = document.getElementById("profileStatMessages") || document.getElementById("statMessages");
const profileStatMedia  = document.getElementById("profileStatMedia") || document.getElementById("statMedia");
const profileStatLinks  = document.getElementById("profileStatLinks") || document.getElementById("statLinks");
const profileStatFiles  = document.getElementById("profileStatFiles") || document.getElementById("statFiles");
const removeFriendBtn   = document.getElementById("removeFriendBtn");
const messagesEl        = document.getElementById("messages");
const meAvatar          = document.getElementById("meAvatar");
const infoPanelName     = document.getElementById("infoPanelName");
const infoPanelAvatar   = document.getElementById("infoPanelAvatar");
const infoPanelHandle   = document.getElementById("infoPanelHandle");
const infoPanelStatus   = document.getElementById("infoPanelStatus");
const messageForm       = document.getElementById("messageForm");
const messageInput      = document.getElementById("messageInput");
const toast             = document.getElementById("toast");
const typingIndicator   = document.getElementById("typingIndicator");
const typingText        = document.getElementById("typingText");
const connectionLabel   = document.getElementById("connectionLabel");
const networkPill       = document.getElementById("networkPill");
const requestCount      = document.getElementById("requestCount");
const friendCount       = document.getElementById("friendCount");
const onlineCount       = document.getElementById("onlineCount");
const contactsRequestsBtn = document.getElementById("contactsRequestsBtn");
const contactsRequestsPanel = document.getElementById("contactsRequestsPanel");
const contactsRequestsBadge = document.getElementById("contactsRequestsBadge");
const discoverPanel    = document.getElementById("discoverPanel");
const discoverList     = document.getElementById("discoverList");
const discoverEmpty    = document.getElementById("discoverEmpty");
const sendButton        = messageForm ? messageForm.querySelector('button[type="submit"]') : null;
const voiceBtn          = document.getElementById("voiceBtn");
const voiceStatus       = document.getElementById("voiceStatus");
const voiceTimer        = document.getElementById("voiceTimer");
const voiceLabel        = document.getElementById("voiceLabel");
const voiceCancelBtn    = document.getElementById("voiceCancelBtn");
const voiceStopBtn      = document.getElementById("voiceStopBtn");
const voiceProgress     = document.getElementById("voiceProgress");
const voiceProgressBar  = document.getElementById("voiceProgressBar");
const voiceProgressText = document.getElementById("voiceProgressText");
const messageSearchToggle = document.getElementById("messageSearchToggle");
const messageSearchPanel = document.getElementById("messageSearchPanel");
const messageSearchInput = document.getElementById("messageSearchInput");
const messageSearchClear = document.getElementById("messageSearchClear");
const messageSearchPrev  = document.getElementById("messageSearchPrev");
const messageSearchNext  = document.getElementById("messageSearchNext");
const messageSearchCount = document.getElementById("messageSearchCount");
const callButton       = document.querySelector(".chat-header-actions .call-btn");
const videoButton      = document.querySelector(".chat-header-actions .video-btn");
const profileCallBtn   = document.querySelector(".profile-action-btn[data-action='call']");
const profileVideoBtn  = document.querySelector(".profile-action-btn[data-action='video']");
const callModal        = document.getElementById("callModal");
const callBadge        = document.getElementById("callBadge");
const callAvatar       = document.getElementById("callAvatar");
const callMiniAvatar   = document.getElementById("callMiniAvatar");
const callPeerName     = document.getElementById("callPeerName");
const callStatusText   = document.getElementById("callStatusText");
const callDurationText = document.getElementById("callDuration");
const callMuteBtn      = document.getElementById("callMuteBtn");
const callSpeakerBtn   = document.getElementById("callSpeakerBtn");
const callCameraBtn    = document.getElementById("callCameraBtn");
const callFlipBtn      = document.getElementById("callFlipBtn");
const callAcceptBtn    = document.getElementById("callAcceptBtn");
const callRejectBtn    = document.getElementById("callRejectBtn");
const callHangupBtn    = document.getElementById("callHangupBtn");
const callMinimizeBtn  = document.getElementById("callMinimizeBtn");
const callRemoteAudio  = document.getElementById("callRemoteAudio");
const callRemoteVideo  = document.getElementById("callRemoteVideo");
const callLocalVideo   = document.getElementById("callLocalVideo");
const callMini         = document.getElementById("callMini");
const callMiniName     = document.getElementById("callMiniName");
const callMiniStatus   = document.getElementById("callMiniStatus");
const callMiniTime     = document.getElementById("callMiniTime");
const callMiniEnd      = document.getElementById("callMiniEnd");
const callLogList      = document.getElementById("callLogList");
const callHistoryList  = document.getElementById("callHistoryList");
const navRailButtons   = Array.from(document.querySelectorAll(".tab-btn[data-rail], .nav-btn[data-rail]"));
const navSettingsBtn   = document.getElementById("navSettingsBtn");
const settingsPanel    = document.getElementById("settingsPanel");
const settingsCloseBtn = document.getElementById("settingsCloseBtn");
const settingsAvatar   = document.getElementById("settingsAvatar");
const settingsProfileName = document.getElementById("settingsProfileName");
const settingsProfileHandle = document.getElementById("settingsProfileHandle");
const sidebarBrand = document.querySelector(".app-brand");
const sidebarTopActions = document.querySelector(".sidebar-top-actions");
const callFilterButtons = Array.from(document.querySelectorAll("[data-call-filter]"));
const mobileSidebar     = document.getElementById("mobileSidebar");
const mobileChat        = document.getElementById("mobileChat");
const mobBackBtn        = document.getElementById("mobBackBtn");
const SESSION_KEY       = "novyn-session";
const REMEMBER_KEY      = "novyn-remember";
const LOGIN_PATH        = "/";
const isDashboardPage   = Boolean(chatLayout) && !document.body.classList.contains("auth-page");
const MOBILE_BP         = 768;
const INCOMING_CALLS_ENABLED = true;

let me           = "";
let activeFriend = "";
let friends      = [];
let hasGreeted   = false;
let requests     = [];
let discoverUsers = [];
let replyTo      = null;
let searchPanelOpen = false;
let friendSearchQuery = "";
let sidebarView = "messages";
let settingsOpen = false;
let callFilter = "all";
const sidebarBrandHTML = sidebarBrand ? sidebarBrand.innerHTML : "";
const searchState = {
  hits: [],
  index: -1,
  query: "",
};
const friendSuggestState = {
  timer: null,
  lastQuery: "",
};
let myProfile    = { avatarId: "", displayName: "", age: "", gender: "", bio: "" };
let conversationMessages = [];
let pendingUnreadJump = { friendKey: "", count: 0 };
let lastInfoPanelFriendKey = "";
let messageWindowStart = 0;
let messageWindowEnd = 0;
let loadOlderBtn = null;
const MAX_VISIBLE_MESSAGES = 200;
const MESSAGE_WINDOW_PAGE = 80;
const pendingQueue = [];
const pendingByTempId = new Map();
let networkStateLabel = "";
let networkStateMode = "";
window._novynProfile = myProfile;

const localTyping = {
  active:    false,
  target:    "",
  timeoutId: null,
};
const scrollState = {
  pinnedToBottom: true,
};
const EMPTY_CONVERSATION_HINT = "Choose a conversation to start messaging.";
const DELETED_MESSAGE_TEXT = "This message was deleted.";
const CALL_LOG_PREFIX = "__call_log__:";
const CALL_HISTORY_KEY = "novyn-call-history";
const MAX_CALL_HISTORY = 200;

// ─── Utilities ───────────────────────────────────────────────────────────────

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeSearchText(value) {
  return String(value || "").trim().toLowerCase();
}

function isNativePlatform() {
  try {
    return Boolean(
      window.Capacitor &&
      typeof window.Capacitor.isNativePlatform === "function" &&
      window.Capacitor.isNativePlatform()
    );
  } catch (_) {
    return false;
  }
}

function openExternalLink(href) {
  const url = String(href || "").trim();
  if (!url) return;
  const cap = window.Capacitor;
  const browser = cap && cap.Plugins && cap.Plugins.Browser;
  if (browser && typeof browser.open === "function") {
    browser.open({ url });
    return;
  }
  const popup = window.open(url, "_blank", "noopener,noreferrer");
  if (!popup) {
    if (!isNativePlatform()) {
      window.location.href = url;
      return;
    }
    try {
      const base = window.location.origin;
      const resolved = new URL(url, base);
      if (resolved.origin !== base) {
        window.location.href = resolved.href;
      }
    } catch (_) {
      // Ignore URL parsing errors.
    }
  }
}

function setSidebarView(nextView, options = {}) {
  const allowed = ["messages", "calls", "contacts", "discover"];
  const view = allowed.includes(nextView) ? nextView : "messages";
  const prevView = sidebarView;
  sidebarView = view;
  document.body.dataset.rail = view;
  navRailButtons.forEach((btn) => {
    const btnView = btn.dataset.rail || "";
    if (btnView === "settings") return;
    btn.classList.toggle("active", btnView === view);
  });
  if (sidebarBrand) {
    if (view === "messages") {
      sidebarBrand.innerHTML = sidebarBrandHTML || "Novyn";
    } else if (view === "calls") {
      sidebarBrand.textContent = "Calls";
    } else if (view === "contacts") {
      sidebarBrand.textContent = "Contacts";
    } else if (view === "discover") {
      sidebarBrand.textContent = "Discover";
    }
  }
  if (sidebarTopActions) {
    sidebarTopActions.style.display = view === "messages" ? "" : "none";
  }
  if (networkPill) {
    networkPill.style.display = view === "messages" ? "" : "none";
  }
  if (sidebarSearch) {
    if (view === "calls") {
      sidebarSearch.placeholder = "Search calls...";
    } else if (view === "contacts") {
      sidebarSearch.placeholder = "Search contacts...";
    } else if (view === "discover") {
      sidebarSearch.placeholder = "Find people or groups...";
    } else {
      sidebarSearch.placeholder = "Search friends...";
    }
  }
  if (view === "discover") {
    requestDiscoverOnline();
  }
  if (view === "contacts" && prevView !== "contacts") {
    if (sidebarSearch && sidebarSearch.value) sidebarSearch.value = "";
    if (friendSearchQuery) friendSearchQuery = "";
  }
  if (view !== "calls" && callFilter !== "all") {
    setCallFilter("all");
  }
  if (view !== "contacts") {
    setRequestsPanelOpen(false);
  }
  if (!options.silent) {
    renderRequests();
    renderFriends();
    renderCallHistory();
    renderDiscover();
  }
}

function setRequestsPanelOpen(nextState) {
  if (!contactsRequestsPanel || !contactsRequestsBtn) return;
  const isOpen = Boolean(nextState);
  contactsRequestsPanel.classList.toggle("is-open", isOpen);
  contactsRequestsPanel.setAttribute("aria-hidden", isOpen ? "false" : "true");
  contactsRequestsBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

function updateRequestsBadge() {
  if (!contactsRequestsBadge) return;
  const count = requests.length || 0;
  if (count > 0) {
    contactsRequestsBadge.textContent = count > 99 ? "99+" : String(count);
    contactsRequestsBadge.style.display = "";
  } else {
    contactsRequestsBadge.style.display = "none";
  }
}

function setSettingsOpen(nextState) {
  if (!settingsPanel) return;
  settingsOpen = Boolean(nextState);
  document.body.classList.toggle("settings-open", settingsOpen);
  settingsPanel.setAttribute("aria-hidden", settingsOpen ? "false" : "true");
  if (navSettingsBtn) navSettingsBtn.classList.toggle("active", settingsOpen);
  if (settingsOpen) {
    navRailButtons.forEach((btn) => {
      const btnView = btn.dataset.rail || "";
      if (btnView && btnView !== "settings") btn.classList.remove("active");
    });
    document.body.dataset.rail = "settings";
    syncSettingsPanel();
  } else {
    setSidebarView(sidebarView, { silent: true });
  }
}

function clearSidebarSearch() {
  if (!sidebarSearch) return;
  sidebarSearch.value = "";
  friendSearchQuery = "";
}

function showSidebarListOnMobile(options = {}) {
  const usePanels = window._novynPanels && typeof window._novynPanels.show === "function";
  const isMobile = usePanels && typeof window._novynPanels.isMobile === "function"
    ? window._novynPanels.isMobile()
    : window.innerWidth <= MOBILE_BP;
  if (!isMobile) return;
  if (usePanels) {
    window._novynPanels.show("friends", { silent: options.silent !== false });
    return;
  }
  showSidebarOnMobile();
}

function switchRail(nextView, options = {}) {
  const view = String(nextView || "").trim();
  if (!view) return;
  if (view === "settings") {
    setSettingsOpen(true);
    return;
  }
  if (settingsOpen) setSettingsOpen(false);
  setSidebarView(view, options);
  showSidebarListOnMobile({ silent: true });
}

window.switchRail = switchRail;
window._novynOpenSettingsPanel = () => setSettingsOpen(true);
window._novynCloseSettingsPanel = () => setSettingsOpen(false);
window._novynToggleSettingsPanel = () => setSettingsOpen(!settingsOpen);

function syncSettingsPanel() {
  if (!settingsPanel) return;
  const handle = me ? `@${me}` : "@you";
  if (settingsProfileName) settingsProfileName.textContent = getMyDisplayName();
  if (settingsProfileHandle) settingsProfileHandle.textContent = handle;
  if (settingsAvatar) {
    const fallback = (me || "?").slice(0, 2).toUpperCase();
    if (myProfile.avatarId && window._novynAvatarUtils) {
      window._novynAvatarUtils.applyAvatarToEl(settingsAvatar, myProfile.avatarId, fallback);
    } else {
      settingsAvatar.textContent = fallback;
      settingsAvatar.style.background = "";
    }
  }
}

function setCallFilter(nextFilter) {
  const allowed = ["all", "missed", "video"];
  callFilter = allowed.includes(nextFilter) ? nextFilter : "all";
  callFilterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.callFilter === callFilter);
  });
  renderCallHistory();
}

function collectCallHistoryEntries() {
  const entries = [];
  const seen = new Set();
  const pushEntry = (friend, message, log) => {
    if (!friend || !message) return;
    const key = `${normalizeName(friend.username)}|${message.timestamp || ""}|${message.text || ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({ friend, message, log });
  };

  const cached = readCallHistoryCache();
  cached.forEach((entry) => {
    if (!entry || !entry.text) return;
    const log = parseCallLogPayload(entry.text);
    if (!log) return;
    const friendName = String(entry.friend || "").trim();
    if (!friendName) return;
    const friend = findFriend(friendName) || { username: friendName, displayName: "" };
    pushEntry(friend, {
      text: entry.text,
      timestamp: entry.timestamp || "",
      from: entry.from || friendName,
    }, log);
  });

  friends.forEach((friend) => {
    const rawText = friend?.lastMessage || "";
    if (!rawText) return;
    const log = parseCallLogPayload(rawText);
    if (!log) return;
    pushEntry(friend, {
      text: rawText,
      timestamp: friend.lastTimestamp || "",
      from: friend.lastFrom || friend.username || "",
    }, log);
  });

  if (activeFriend && Array.isArray(conversationMessages)) {
    const friend = findFriend(activeFriend) || { username: activeFriend, displayName: "" };
    conversationMessages.forEach((message) => {
      if (!message) return;
      const log = parseCallLogPayload(message.text);
      if (!log) return;
      pushEntry(friend, message, log);
    });
  }

  return entries;
}

function renderCallHistory() {
  if (!callHistoryList) return;
  callHistoryList.innerHTML = "";

  const query = friendSearchQuery;
  const entries = collectCallHistoryEntries();
  const filtered = entries.filter((entry) => {
    const log = entry.log || parseCallLogPayload(entry.message?.text || "");
    if (!log) return false;
    if (callFilter === "missed") {
      const missedStatuses = ["missed", "declined", "busy", "unavailable", "cancelled"];
      if (!missedStatuses.includes(log.status)) return false;
    }
    if (callFilter === "video") {
      if (log.mediaType && log.mediaType !== "video") return false;
    }
    if (!query) return true;
    const name = getFriendDisplayName(entry.friend || {});
    const handle = entry.friend?.username || "";
    return normalizeSearchText(`${name} ${handle}`).includes(query);
  });

  if (!filtered.length) {
    const empty = document.createElement("li");
    empty.className = "item-card list-empty";
    const rawQuery = sidebarSearch ? sidebarSearch.value.trim() : "";
    empty.textContent = query ? `No calls match "${rawQuery || friendSearchQuery}"` : "No calls yet";
    callHistoryList.appendChild(empty);
    return;
  }

  filtered.sort((a, b) => {
    const aTs = a.message?.timestamp || a.friend?.lastTimestamp || "";
    const bTs = b.message?.timestamp || b.friend?.lastTimestamp || "";
    if (aTs && bTs) return bTs.localeCompare(aTs);
    if (aTs) return -1;
    if (bTs) return 1;
    return 0;
  });

  filtered.forEach((entry) => {
    const friend = entry.friend || {};
    const message = entry.message || {};
    const log = entry.log || parseCallLogPayload(message.text);
    if (!log) return;
    const fromMe = normalizeName(message.from) === normalizeName(me);
    const display = getCallLogDisplay(log, fromMe);
    const timeText = formatFriendTime(message.timestamp || friend.lastTimestamp || "");
    const isBadStatus = ["cancelled", "declined", "missed", "busy", "unavailable"].includes(display.status);
    const isNeutralStatus = display.status === "ended";
    const statusClass = isNeutralStatus ? "neutral" : (isBadStatus ? "bad" : "good");

    const item = document.createElement("li");
    const mediaClass = log.mediaType === "video" ? "video" : "audio";
    item.className = `call-log-item ${display.direction === "incoming" ? "incoming" : "outgoing"} status-${statusClass} ${mediaClass}`;

    const icon = document.createElement("div");
    icon.className = "call-log-item-icon";
    icon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>`;

    const content = document.createElement("div");
    content.className = "call-log-item-content";
    const title = document.createElement("div");
    title.className = "call-log-item-title";
    title.textContent = getFriendDisplayName(friend);
    const subtitle = document.createElement("div");
    subtitle.className = "call-log-item-subtitle";
    subtitle.textContent = display.subtitle;
    const status = document.createElement("div");
    status.className = `call-status-pill ${statusClass}`;
    status.textContent = display.title;
    content.append(title, subtitle, status);

    const time = document.createElement("div");
    time.className = "call-log-item-time";
    time.textContent = timeText || "";

    const actionBtn = document.createElement("button");
    actionBtn.type = "button";
    actionBtn.className = "call-log-action";
    actionBtn.title = "Call back";
    actionBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>`;
    actionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (friend?.username) {
        setActiveFriend(friend.username);
        setTimeout(() => startVoiceCall(), 240);
      }
    });

    item.addEventListener("click", () => {
      if (friend?.username) setActiveFriend(friend.username);
    });

    item.append(icon, content, time, actionBtn);
    callHistoryList.appendChild(item);
  });
}

function showChatOnMobile() {
  if (!mobileSidebar || !mobileChat) return;
  if (window.innerWidth > MOBILE_BP) return;
  mobileSidebar.setAttribute("data-mob-hidden", "true");
  mobileChat.removeAttribute("data-mob-hidden");
  document.body.classList.add("mob-chat-open");
  document.body.classList.remove("mob-list-open");
}

function showSidebarOnMobile() {
  if (!mobileSidebar || !mobileChat) return;
  if (window.innerWidth > MOBILE_BP) return;
  mobileSidebar.removeAttribute("data-mob-hidden");
  mobileChat.setAttribute("data-mob-hidden", "true");
  document.body.classList.remove("mob-chat-open");
  document.body.classList.add("mob-list-open");
}

function setActiveChatTarget(friendName) {
  if (!socketAvailable || !isDashboardPage) return;
  socket.emit("set_active_chat", friendName || "");
}

function getFriendSearchBlob(friend) {
  const displayName = getFriendDisplayName(friend);
  const bio = friend?.bio || "";
  const username = friend?.username || "";
  const lastMessage = friend?.lastMessage || "";
  const lastFrom = friend?.lastFrom || "";
  const preview = friendPreview(friend);
  return normalizeSearchText(
    `${displayName} ${username} ${bio} ${lastMessage} ${lastFrom} ${preview}`
  );
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

function writeStoredSession(session) {
  const email = String(session?.email || "").trim();
  const username = String(session?.username || "").trim();
  const password = String(session?.password || "");
  if ((!email && !username) || !password) return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email, username, password }));
  } catch (_) {}
  try {
    if (localStorage.getItem(REMEMBER_KEY) === "1") {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ email, username, password }));
    }
  } catch (_) {}
}

function clearStoredSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (_) {
    // Ignore storage failures.
  }
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  } catch (_) {}
}

function redirectToLogin() {
  if (window.location.pathname === LOGIN_PATH) return;
  window.location.replace(LOGIN_PATH);
}

function authenticateStoredSession(force = false) {
  if (!socketAvailable || !isDashboardPage) return;
  const session = readStoredSession();
  if (!session) {
    redirectToLogin();
    return;
  }
  if (!socket.connected) return;
  if (authenticateStoredSession._pending && !force) return;
  authenticateStoredSession._pending = true;
  const payload = session.email
    ? { email: session.email, password: session.password, mode: "signin" }
    : { username: session.username, password: session.password };
  socket.emit("register", payload);
}

authenticateStoredSession._pending = false;

if (isDashboardPage && !readStoredSession()) {
  redirectToLogin();
}

function getLocalDateKey(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateSeparatorLabel(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  const now = new Date();

  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysDiff = Math.round((startOfNow - startOfDate) / (24 * 60 * 60 * 1000));

  if (daysDiff === 0) return "Today";
  if (daysDiff === 1) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function formatFullTimestamp(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getMessageStatusKey(message) {
  if (message?.pending) return "pending";
  if (message?.seenAt) return "seen";
  if (message?.deliveredAt) return "delivered";
  return "sent";
}

const notificationAudio = {
  context: null,
  unlocked: false,
};
const notificationState = {
  permissionRequested: false,
};
const pushState = {
  publicKey: "",
  inFlight: false,
  lastEndpoint: "",
  lastUser: "",
};

function unlockNotificationAudio() {
  if (notificationAudio.unlocked) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  try {
    if (!notificationAudio.context) notificationAudio.context = new AudioCtx();
    const ctx = notificationAudio.context;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    notificationAudio.unlocked = true;
  } catch (_) {
    // Ignore browsers that block audio context creation.
  }
}

function playIncomingPing() {
  const ctx = notificationAudio.context;
  if (!notificationAudio.unlocked || !ctx) return;
  try {
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, now);
    oscillator.frequency.exponentialRampToValueAtTime(560, now + 0.14);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.17);
  } catch (_) {
    // Ignore transient audio failures.
  }
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  if (notificationState.permissionRequested) return Notification.permission;
  notificationState.permissionRequested = true;
  try {
    return await Notification.requestPermission();
  } catch (_) {
    return Notification.permission;
  }
}

function canSystemNotify() {
  return "Notification" in window && Notification.permission === "granted";
}

function shouldSystemNotify() {
  return document.hidden || !document.hasFocus();
}

function isAppVisible() {
  return !document.hidden && document.hasFocus();
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getPushPublicKey() {
  if (pushState.publicKey) return pushState.publicKey;
  try {
    const res = await fetch("/api/push/public-key", { cache: "no-store" });
    if (!res.ok) return "";
    const data = await res.json();
    pushState.publicKey = String(data?.publicKey || "").trim();
    return pushState.publicKey;
  } catch (_) {
    return "";
  }
}

async function ensurePushSubscription(requestPermission = false) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  if (!socketAvailable || !me) return;
  if (pushState.inFlight) return;

  if (Notification.permission === "default" && requestPermission) {
    await requestNotificationPermission();
  }
  if (Notification.permission !== "granted") return;

  pushState.inFlight = true;
  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration?.pushManager) return;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const publicKey = await getPushPublicKey();
      if (!publicKey) return;
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const payload = subscription.toJSON ? subscription.toJSON() : subscription;
    const endpoint = payload?.endpoint || "";
    const userKey = normalizeName(me);
    if (!endpoint) return;
    if (pushState.lastEndpoint === endpoint && pushState.lastUser === userKey) return;
    pushState.lastEndpoint = endpoint;
    pushState.lastUser = userKey;
    socket.emit("push_subscribe", { subscription: payload });
  } catch (err) {
    console.warn("Push subscription failed:", err);
  } finally {
    pushState.inFlight = false;
  }
}

function showSystemNotification(title, options = {}) {
  if (!canSystemNotify()) return false;
  try {
    const notification = new Notification(title, options);
    notification.onclick = () => {
      try {
        window.focus();
      } catch (_) {
        // Ignore focus errors.
      }
    };
    return true;
  } catch (_) {
    return false;
  }
}

function formatNotificationPreview(text, maxLen = 120) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "New message";
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen - 3)}...`;
}

function notifyIncomingMessage(message, options = {}) {
  if (!message) return;
  if (normalizeName(message.from) === normalizeName(me)) return;
  const isActiveThread =
    activeFriend && normalizeName(message.from) === normalizeName(activeFriend);
  if (!options.force && isActiveThread && isAppVisible()) return;
  const senderName = options.senderName || (() => {
    const sender = findFriend(message.from);
    return sender ? getFriendDisplayName(sender) : message.from;
  })();
  const callPreview = formatCallLogPreview(message.text, false);
  const bodyText = callPreview || formatNotificationPreview(message.text);
  showSystemNotification(`New message from ${senderName}`, {
    body: formatNotificationPreview(bodyText),
    tag: `msg-${normalizeName(message.from) || "unknown"}`,
  });
}

function notifyIncomingCall(from, options = {}) {
  if (!from) return;
  if (!options.force && !shouldSystemNotify()) return;
  const displayName = getCallPeerDisplayName(from);
  const body = options.blocked
    ? `${displayName} tried to call you.`
    : `${displayName} is calling.`;
  showSystemNotification("Incoming call", {
    body,
    tag: `call-${normalizeName(from) || "unknown"}`,
  });
}

function handleUserGesture() {
  unlockNotificationAudio();
  requestNotificationPermission();
  ensurePushSubscription(true);
}

document.addEventListener("pointerdown", handleUserGesture, { passive: true });
document.addEventListener("keydown", handleUserGesture, { passive: true });

/**
 * Smooth-scroll the messages container to the bottom.
 * Uses scrollTo with behavior:'smooth' so it animates instead of jumping.
 * Falls back to instant scroll for initial history load (skipAnimation).
 */
function scrollToBottom(skipAnimation = false) {
  if (!messagesEl) return;
  messagesEl.scrollTo({
    top:      messagesEl.scrollHeight,
    behavior: skipAnimation ? "auto" : "smooth",
  });
}

/**
 * Returns true when the user is already near the bottom of the message list.
 * We only auto-scroll when they're within 120px of the bottom — if they've
 * scrolled up to read history, we don't yank them back down on new messages.
 */
function isNearBottom() {
  const threshold = 120;
  return (
    messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight <=
    threshold
  );
}

// ─── Network state ────────────────────────────────────────────────────────────

function renderNetworkState() {
  if (!connectionLabel || !networkPill) return;
  const queuedSuffix = pendingQueue.length ? ` · ${pendingQueue.length} queued` : "";
  connectionLabel.textContent = `${networkStateLabel || ""}${queuedSuffix}`;
  networkPill.classList.remove("connected", "offline");
  if (networkStateMode === "connected") networkPill.classList.add("connected");
  if (networkStateMode === "offline")   networkPill.classList.add("offline");
}

function setNetworkState(label, state) {
  networkStateLabel = label;
  networkStateMode = state;
  renderNetworkState();
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(message, type = "info") {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden", "error", "success");
  if (type === "error")   toast.classList.add("error");
  if (type === "success") toast.classList.add("success");

  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2800);
}

// ─── Username suggestions ─────────────────────────────────────────────────────

function clearUsernameSuggestions() {
  if (!usernameHint || !usernameSuggestions) return;
  usernameHint.textContent = "";
  usernameHint.classList.add("hidden");
  usernameSuggestions.innerHTML = "";
  usernameSuggestions.classList.add("hidden");
}

function showUsernameSuggestions(requested, suggestions) {
  if (!usernameHint || !usernameSuggestions) return;
  const list = Array.isArray(suggestions) ? suggestions.slice(0, 6) : [];

  usernameHint.textContent = `"${requested}" is taken. Try one of these:`;
  usernameHint.classList.remove("hidden");
  usernameSuggestions.innerHTML = "";

  for (const suggestion of list) {
    const btn      = document.createElement("button");
    btn.type       = "button";
    btn.className  = "suggestion-chip";
    btn.textContent = suggestion;
    btn.addEventListener("click", () => {
      usernameInput.value = suggestion;
      usernameInput.focus();
      clearUsernameSuggestions();
    });
    usernameSuggestions.appendChild(btn);
  }

  usernameSuggestions.classList.toggle("hidden", list.length === 0);
}

function clearFriendSuggestions() {
  if (!friendSuggestions) return;
  friendSuggestions.innerHTML = "";
  friendSuggestions.classList.add("hidden");
}

function showFriendSuggestions(requested, suggestions) {
  if (!friendSuggestions) return;
  const list = Array.isArray(suggestions) ? suggestions.slice(0, 8) : [];
  friendSuggestions.innerHTML = "";
  for (const suggestion of list) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "friend-suggestion-item";

    const avatar = document.createElement("span");
    avatar.className = "friend-suggestion-avatar";
    avatar.textContent = suggestion.slice(0, 2).toUpperCase();

    const label = document.createElement("span");
    label.textContent = suggestion;

    btn.append(avatar, label);
    btn.addEventListener("click", () => {
      if (friendInput) {
        friendInput.value = suggestion;
        friendInput.focus();
      }
      clearFriendSuggestions();
    });
    friendSuggestions.appendChild(btn);
  }
  friendSuggestions.classList.toggle("hidden", list.length === 0 || !requested);
}

// ─── Time formatting ──────────────────────────────────────────────────────────

function prettyTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatFriendTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return prettyTime(iso);
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatAudioTime(seconds) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function getAudioDuration(audio) {
  if (!audio) return 0;
  const dur = audio.duration;
  if (Number.isFinite(dur) && dur > 0) return dur;
  if (audio.seekable && audio.seekable.length) {
    try {
      const end = audio.seekable.end(audio.seekable.length - 1);
      if (Number.isFinite(end) && end > 0) return end;
    } catch (_) {
      // Ignore seekable errors.
    }
  }
  return 0;
}

const WAVE_BAR_COUNT = 28;
const WAVE_BAR_MIN = 4;
const WAVE_BAR_MAX = 24;

function hashStringToSeed(value) {
  const str = String(value || "");
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildWaveform(waveformEl, seed) {
  if (!waveformEl) return;
  const rng = seededRng(seed);
  waveformEl.innerHTML = "";
  for (let i = 0; i < WAVE_BAR_COUNT; i += 1) {
    const bar = document.createElement("span");
    bar.className = "wv-bar pending";
    const height = Math.round(WAVE_BAR_MIN + rng() * (WAVE_BAR_MAX - WAVE_BAR_MIN));
    bar.style.height = `${height}px`;
    waveformEl.appendChild(bar);
  }
}

function updateWaveformProgress(waveformEl, progress) {
  if (!waveformEl) return;
  const bars = waveformEl.querySelectorAll(".wv-bar");
  const played = Math.round(Math.max(0, Math.min(1, progress)) * bars.length);
  bars.forEach((bar, i) => {
    if (i < played) {
      bar.classList.add("played");
      bar.classList.remove("pending");
    } else {
      bar.classList.add("pending");
      bar.classList.remove("played");
    }
  });
}

function formatCallDuration(totalSeconds) {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function buildCallLogPayload(status, direction, durationSeconds, mediaType) {
  const safeStatus = String(status || "").trim() || "ended";
  const safeDirection = String(direction || "").trim() || "outgoing";
  const safeDuration = Number.isFinite(durationSeconds) ? Math.max(0, Math.floor(durationSeconds)) : 0;
  const safeMedia = String(mediaType || "").trim() || "audio";
  return `${CALL_LOG_PREFIX}${safeStatus}|${safeDirection}|${safeDuration}|${safeMedia}`;
}

function parseCallLogPayload(rawText) {
  const text = String(rawText || "");
  if (!text.startsWith(CALL_LOG_PREFIX)) return null;
  const body = text.slice(CALL_LOG_PREFIX.length);
  const [status, direction, duration, mediaType] = body.split("|");
  if (!status) return null;
  const seconds = Number.isFinite(Number(duration)) ? Math.max(0, Math.floor(Number(duration))) : 0;
  return {
    status: String(status || "").trim() || "ended",
    direction: String(direction || "").trim() || "outgoing",
    duration: seconds,
    mediaType: String(mediaType || "").trim() || "audio",
  };
}

function getCallHistoryStorageKey() {
  const userKey = normalizeName(me || "");
  return userKey ? `${CALL_HISTORY_KEY}:${userKey}` : CALL_HISTORY_KEY;
}

function readCallHistoryCache() {
  const key = getCallHistoryStorageKey();
  try {
    const raw = localStorage.getItem(key);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function writeCallHistoryCache(list) {
  const key = getCallHistoryStorageKey();
  try {
    localStorage.setItem(key, JSON.stringify(list.slice(0, MAX_CALL_HISTORY)));
  } catch (_) {}
}

function addCallHistoryEntry(entry) {
  if (!entry || !entry.friend || !entry.text) return false;
  if (!me) return false;
  const list = readCallHistoryCache();
  const entryId = entry.id
    ? String(entry.id)
    : `${normalizeName(entry.friend)}|${entry.timestamp || ""}|${entry.text}`;
  if (list.some((item) => item._id === entryId)) return false;
  list.unshift({
    _id: entryId,
    friend: entry.friend,
    text: entry.text,
    timestamp: entry.timestamp || "",
    from: entry.from || "",
  });
  writeCallHistoryCache(list);
  return true;
}

function cacheCallLogMessage(message) {
  const log = parseCallLogPayload(message?.text);
  if (!log) return false;
  const other = normalizeName(message?.from) === normalizeName(me) ? message?.to : message?.from;
  const friend = String(other || "").trim();
  if (!friend) return false;
  return addCallHistoryEntry({
    id: message.id,
    friend,
    text: message.text,
    timestamp: message.timestamp || "",
    from: message.from || "",
  });
}

function cacheCallLogMessages(messages) {
  if (!Array.isArray(messages)) return;
  messages.forEach((msg) => cacheCallLogMessage(msg));
}

function invertCallDirection(direction) {
  if (direction === "outgoing") return "incoming";
  if (direction === "incoming") return "outgoing";
  return direction || "outgoing";
}

function getCallLogDisplay(log, fromMe) {
  const direction = fromMe ? log.direction : invertCallDirection(log.direction);
  const isVideo = log.mediaType === "video";
  const mediaLabel = isVideo ? "Video call" : "Call";
  const title = direction === "incoming"
    ? (isVideo ? "Incoming video" : "Incoming call")
    : (isVideo ? "Outgoing video" : "Outgoing call");
  let subtitle = mediaLabel;
  let statusLabel = "Ended";
  const isIncoming = direction === "incoming";
  if (log.status === "ended") {
    subtitle = log.duration > 0 ? `${mediaLabel} ended - ${formatCallDuration(log.duration)}` : `${mediaLabel} ended`;
    statusLabel = "Ended";
  } else if (log.status === "cancelled") {
    subtitle = isIncoming ? `Missed ${mediaLabel.toLowerCase()}` : `${mediaLabel} cancelled`;
    statusLabel = "Cancelled";
  } else if (log.status === "declined") {
    subtitle = isIncoming ? `Missed ${mediaLabel.toLowerCase()}` : `${mediaLabel} declined`;
    statusLabel = "Declined";
  } else if (log.status === "missed") {
    subtitle = `Missed ${mediaLabel.toLowerCase()}`;
    statusLabel = "Missed";
  } else if (log.status === "busy") {
    subtitle = isIncoming ? `Missed ${mediaLabel.toLowerCase()}` : "User busy";
    statusLabel = "Busy";
  } else if (log.status === "unavailable") {
    subtitle = isIncoming ? `Missed ${mediaLabel.toLowerCase()}` : "User unavailable";
    statusLabel = "Unavailable";
  }
  return { title, subtitle, direction, status: log.status, statusLabel };
}

function formatCallLogPreview(rawText, fromMe) {
  const log = parseCallLogPayload(rawText);
  if (!log) return "";
  const display = getCallLogDisplay(log, fromMe);
  return `📞 ${display.subtitle}`;
}

function formatLastSeen(iso) {
  if (!iso) return "Offline";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Offline";

  const now = new Date();
  const timeText = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (date.toDateString() === now.toDateString()) {
    return `Last seen ${timeText}`;
  }

  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (date.toDateString() === y.toDateString()) {
    return `Last seen yesterday ${timeText}`;
  }

  const dateText = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `Last seen ${dateText}, ${timeText}`;
}

function cleanDisplayName(value) {
  return String(value || "").trim();
}

function getMyDisplayName() {
  const display = cleanDisplayName(myProfile.displayName);
  if (display) return display;
  return me ? `@${me}` : "@you";
}

function renderMyName() {
  if (!meName) return;
  meName.textContent = getMyDisplayName();
  meName.title = me ? `@${me}` : "";
}

function getFriendDisplayName(friend) {
  const fallback = String(friend?.username || "").trim();
  const display = cleanDisplayName(friend?.displayName);
  return display || fallback;
}

function displayDiffersFromUsername(friend) {
  const username = String(friend?.username || "").trim();
  const display = cleanDisplayName(friend?.displayName);
  return Boolean(display) && normalizeName(display) !== normalizeName(username);
}

function getFriendPresenceText(friend) {
  const statusText = friend.online ? "Online now" : formatLastSeen(friend.lastSeenAt);
  const bio = cleanDisplayName(friend?.bio);
  if (bio) {
    const compactBio = bio.length > 48 ? `${bio.slice(0, 45)}...` : bio;
    return `${statusText} · ${compactBio}`;
  }
  if (displayDiffersFromUsername(friend)) {
    return `${statusText} · @${friend.username}`;
  }
  return statusText;
}

function getContactBucket(friend) {
  if (friend?.online) return "online";
  const last = new Date(friend?.lastSeenAt || "");
  if (Number.isNaN(last.getTime())) return "offline";
  const diffMinutes = (Date.now() - last.getTime()) / 60000;
  if (diffMinutes <= 60) return "away";
  return "offline";
}

function syncProfilePanelStats() {
  if (!profileStatMessages || !profileStatMedia || !profileStatLinks || !profileStatFiles) return;
  const messages = Array.isArray(conversationMessages) ? conversationMessages : [];
  const linkRegex = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[\/?#][^\s<]*)?/i;
  const mediaRegex = /\.(png|jpe?g|gif|webp|mp4|mov|webm|mp3|wav|ogg)(\?|#|$)/i;
  const fileRegex = /\.(pdf|zip|rar|7z|docx?|pptx?|xlsx?)(\?|#|$)/i;

  let linkCount = 0;
  let mediaCount = 0;
  let fileCount = 0;

  for (const message of messages) {
    if (message?.deletedAt) continue;
    const text = String(message?.text || "");
    if (!text) continue;
    if (linkRegex.test(text)) linkCount += 1;
    if (mediaRegex.test(text)) mediaCount += 1;
    if (fileRegex.test(text)) fileCount += 1;
  }

  profileStatMessages.textContent = String(messages.length);
  profileStatLinks.textContent = String(linkCount);
  profileStatMedia.textContent = String(mediaCount);
  profileStatFiles.textContent = String(fileCount);
}

function syncCallLogPanel() {
  if (!callLogList) return;
  if (!activeFriend) {
    callLogList.innerHTML = '<div class="call-log-empty">No calls yet</div>';
    return;
  }
  const messages = Array.isArray(conversationMessages) ? conversationMessages : [];
  const logs = messages.filter((msg) => parseCallLogPayload(msg?.text));
  if (!logs.length) {
    callLogList.innerHTML = '<div class="call-log-empty">No calls yet</div>';
    return;
  }

  callLogList.innerHTML = "";
  logs
    .slice(-5)
    .reverse()
    .forEach((message) => {
      const log = parseCallLogPayload(message.text);
      if (!log) return;
      const fromMe = normalizeName(message.from) === normalizeName(me);
      const display = getCallLogDisplay(log, fromMe);

      const item = document.createElement("div");
      item.className = `call-log-item ${display.direction === "incoming" ? "incoming" : "outgoing"}`;

      const icon = document.createElement("div");
      icon.className = "call-log-item-icon";
      icon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 9.81 19.79 19.79 0 01.22 1.2 2 2 0 012.22 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16h-.08z"/></svg>`;

      const content = document.createElement("div");
      content.className = "call-log-item-content";
      const title = document.createElement("div");
      title.className = "call-log-item-title";
      title.textContent = display.title;
      const subtitle = document.createElement("div");
      subtitle.className = "call-log-item-subtitle";
      subtitle.textContent = display.subtitle;
      const status = document.createElement("div");
      const isBadStatus = ["cancelled", "declined", "missed", "busy", "unavailable"].includes(display.status);
      const isNeutralStatus = display.status === "ended";
      const statusClass = isNeutralStatus ? "neutral" : (isBadStatus ? "bad" : "good");
      status.className = `call-status-pill ${statusClass}`;
      status.textContent = display.statusLabel || "Call";
      content.append(title, subtitle, status);

      const time = document.createElement("div");
      time.className = "call-log-item-time";
      time.textContent = prettyTime(message.timestamp);

      const actionBtn = document.createElement("button");
      actionBtn.type = "button";
      actionBtn.className = "call-log-action";
      actionBtn.title = "Call back";
      actionBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 9.81 19.79 19.79 0 01.22 1.2 2 2 0 012.22 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16h-.08z"/></svg>`;
      actionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        startVoiceCall();
      });

      item.addEventListener("click", () => startVoiceCall());
      item.append(icon, content, time, actionBtn);
      callLogList.appendChild(item);
    });

  renderCallHistory();
}

function syncProfilePanel(friend) {
  if (!profilePanel || !profilePanelName || !profilePanelAvatar || !profilePanelHandle || !profilePanelStatus) return;

  if (!activeFriend) {
    profilePanelName.textContent = "Select a friend";
    profilePanelHandle.textContent = "@handle";
    profilePanelStatus.textContent = "Offline";
    profilePanelStatus.classList.add("offline");
    profilePanelAvatar.textContent = "?";
    profilePanelAvatar.style.background = "";
    syncProfilePanelStats();
    return;
  }

  const resolvedFriend = friend || findFriend(activeFriend);
  if (!resolvedFriend) {
    profilePanelName.textContent = "Loading...";
    profilePanelHandle.textContent = `@${activeFriend}`;
    profilePanelStatus.textContent = "Loading status...";
    profilePanelStatus.classList.add("offline");
    profilePanelAvatar.textContent = activeFriend.slice(0, 2).toUpperCase();
    profilePanelAvatar.style.background = "";
    syncProfilePanelStats();
    return;
  }

  profilePanelName.textContent = getFriendDisplayName(resolvedFriend);
  profilePanelHandle.textContent = `@${resolvedFriend.username}`;
  profilePanelStatus.textContent = resolvedFriend.online ? "Active now" : formatLastSeen(resolvedFriend.lastSeenAt);
  profilePanelStatus.classList.toggle("offline", !resolvedFriend.online);

  const fallback = resolvedFriend.username.slice(0, 2).toUpperCase();
  if (resolvedFriend.avatarId && window._novynAvatarUtils) {
    window._novynAvatarUtils.applyAvatarToEl(
      profilePanelAvatar,
      resolvedFriend.avatarId,
      fallback
    );
  } else {
    profilePanelAvatar.style.background = "";
    profilePanelAvatar.textContent = fallback;
  }

  syncProfilePanelStats();
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function showTypingIndicator(username) {
  if (!typingIndicator || !typingText) return;
  const typingFriend = findFriend(username); typingText.textContent = `${typingFriend ? getFriendDisplayName(typingFriend) : username} is typing`;
  typingIndicator.classList.remove("hidden");
  // If user is near bottom, scroll down to keep typing dots visible
  if (isNearBottom()) scrollToBottom();
}

function hideTypingIndicator() {
  if (!typingIndicator) return;
  typingIndicator.classList.add("hidden");
}

function emitTyping(isTyping, target = activeFriend) {
  if (!target) return;
  socket.emit("typing", { to: target, isTyping });
}

function clearLocalTypingTimer() {
  if (localTyping.timeoutId) {
    clearTimeout(localTyping.timeoutId);
    localTyping.timeoutId = null;
  }
}

function stopLocalTyping(target = localTyping.target || activeFriend) {
  if (localTyping.active && target) emitTyping(false, target);
  localTyping.active    = false;
  localTyping.target    = "";
  clearLocalTypingTimer();
}

function scheduleLocalTypingStop() {
  clearLocalTypingTimer();
  localTyping.timeoutId = setTimeout(() => stopLocalTyping(), 1200);
}

function markLocalTyping() {
  if (!activeFriend) return;

  // If switched to a different friend while typing, stop the old indicator
  if (
    localTyping.active &&
    localTyping.target &&
    normalizeName(localTyping.target) !== normalizeName(activeFriend)
  ) {
    stopLocalTyping(localTyping.target);
  }

  if (!localTyping.active) emitTyping(true, activeFriend);

  localTyping.active = true;
  localTyping.target = activeFriend;
  scheduleLocalTypingStop();
}

// ─── Messages ─────────────────────────────────────────────────────────────────

function clearMessages() {
  messagesEl.innerHTML = "";
}

function getLastRenderedDateKey() {
  for (let i = messagesEl.children.length - 1; i >= 0; i -= 1) {
    const node = messagesEl.children[i];
    if (!node) continue;
    if (node.classList.contains("message-date-separator") && node.dataset.dateKey) {
      return node.dataset.dateKey;
    }
    if (node.classList.contains("message") && node.dataset.dateKey) {
      return node.dataset.dateKey;
    }
  }
  return "";
}

function appendDateSeparator(iso) {
  const dateKey = getLocalDateKey(iso);
  if (!dateKey) return;

  const previousKey = getLastRenderedDateKey();
  if (previousKey === dateKey) return;

  const separator = document.createElement("div");
  separator.className = "message-date-separator";
  separator.dataset.dateKey = dateKey;
  separator.textContent = formatDateSeparatorLabel(iso);
  messagesEl.appendChild(separator);
}

function getSearchQuery() {
  return normalizeSearchText(messageSearchInput ? messageSearchInput.value : "");
}

function syncMessageSearchUi() {
  const queryActive = Boolean(getSearchQuery());

  if (messageSearchPanel) {
    messageSearchPanel.classList.toggle("hidden", !searchPanelOpen);
  }

  if (messageSearchToggle) {
    messageSearchToggle.classList.toggle("active", queryActive || searchPanelOpen);
    messageSearchToggle.setAttribute("aria-expanded", searchPanelOpen ? "true" : "false");
    messageSearchToggle.title = queryActive ? "Search active" : "Search messages";
  }
}

function openMessageSearchPanel() {
  if (!messageSearchPanel) return;
  searchPanelOpen = true;
  syncMessageSearchUi();
  if (messageSearchInput) {
    messageSearchInput.focus();
    messageSearchInput.select();
  }
}

function closeMessageSearchPanel() {
  searchPanelOpen = false;
  syncMessageSearchUi();
}

function shouldAutoScrollForMessage(message, skipAnimation = false) {
  if (skipAnimation) return true;
  if (getSearchQuery()) return false;

  if (!message) {
    return scrollState.pinnedToBottom || isNearBottom();
  }

  const mine = normalizeName(message.from) === normalizeName(me);
  if (mine) return true;

  return scrollState.pinnedToBottom || isNearBottom();
}

function resetMessageSearch() {
  if (messageSearchInput) messageSearchInput.value = "";
  closeMessageSearchPanel();
  applyMessageSearch();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function highlightText(text, query) {
  if (!query) return escapeHtml(text);
  const source = String(text || "");
  const lower = source.toLowerCase();
  const needle = String(query || "").toLowerCase();
  if (!needle) return escapeHtml(source);
  let result = "";
  let start = 0;
  while (true) {
    const idx = lower.indexOf(needle, start);
    if (idx === -1) {
      result += escapeHtml(source.slice(start));
      break;
    }
    result += escapeHtml(source.slice(start, idx));
    result += `<mark class="msg-highlight">${escapeHtml(source.slice(idx, idx + needle.length))}</mark>`;
    start = idx + needle.length;
  }
  return result;
}

function updateMessageHighlight(row, query) {
  if (!row) return;
  if (row.classList.contains("call-log") || row.classList.contains("message-deleted")) return;
  const body = row.querySelector(".message-body");
  if (!body || body.querySelector(".audio-card")) return;
  const raw = body.dataset.rawText || row.dataset.messageText || "";
  if (!body.dataset.rawText) body.dataset.rawText = raw;
  if (!query) {
    body.innerHTML = "";
    appendMessageTextWithLinks(body, raw);
    return;
  }
  body.innerHTML = highlightText(raw, query);
}

function clearSearchFocus() {
  for (const hit of searchState.hits) {
    hit.classList.remove("search-focus");
  }
}

function setSearchFocus(index, scroll = true) {
  if (!searchState.hits.length) return;
  clearSearchFocus();
  const safeIndex = Math.max(0, Math.min(searchState.hits.length - 1, index));
  searchState.index = safeIndex;
  const target = searchState.hits[safeIndex];
  if (target) {
    target.classList.add("search-focus");
    if (scroll) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

function jumpSearchResult(delta) {
  if (!searchState.hits.length) return;
  const next = searchState.index + delta;
  if (next < 0) {
    setSearchFocus(searchState.hits.length - 1);
  } else if (next >= searchState.hits.length) {
    setSearchFocus(0);
  } else {
    setSearchFocus(next);
  }
}

function updateSearchNavButtons() {
  const hasHits = searchState.hits.length > 0;
  if (messageSearchPrev) messageSearchPrev.disabled = !hasHits;
  if (messageSearchNext) messageSearchNext.disabled = !hasHits;
}

function applyMessageSearch() {
  const query = getSearchQuery();
  const messageNodes = Array.from(messagesEl.querySelectorAll("article.message"));
  let visibleCount = 0;
  const previousQuery = searchState.query;

  searchState.hits = [];
  searchState.query = query;
  if (previousQuery !== query) {
    searchState.index = -1;
    clearSearchFocus();
  }

  for (const row of messageNodes) {
    const searchable = normalizeSearchText(
      row.dataset.searchText || `${row.dataset.messageText || ""} ${row.dataset.messageFrom || ""}`
    );
    const match = !query || searchable.includes(query);
    row.classList.toggle("search-hidden", !match);
    if (match) {
      visibleCount += 1;
      if (query) searchState.hits.push(row);
    }
    updateMessageHighlight(row, query && match ? query : "");
  }

  const separatorNodes = Array.from(messagesEl.querySelectorAll(".message-date-separator"));
  for (const separator of separatorNodes) {
    let hasVisibleMessages = false;
    let cursor = separator.nextElementSibling;
    while (cursor && !cursor.classList.contains("message-date-separator")) {
      if (cursor.classList.contains("message") && !cursor.classList.contains("search-hidden")) {
        hasVisibleMessages = true;
        break;
      }
      cursor = cursor.nextElementSibling;
    }
    separator.classList.toggle("search-hidden", Boolean(query) && !hasVisibleMessages);
  }

  if (messageSearchCount) {
    if (!query) {
      messageSearchCount.classList.add("hidden");
      messageSearchCount.textContent = "";
    } else {
      const total = messageNodes.length;
      messageSearchCount.classList.remove("hidden");
      messageSearchCount.textContent = `${visibleCount}/${total} match${visibleCount === 1 ? "" : "es"}`;
    }
  }

  updateSearchNavButtons();
  syncMessageSearchUi();
}

// ─── Reply UI ─────────────────────────────────────────────────────────────────

const replyBanner = (() => {
  const existing = document.getElementById("replyBanner");
  const banner = existing || document.createElement("div");
  if (!existing) {
    banner.id = "replyBanner";
    banner.className = "reply-banner hidden";
  }
  let preview = banner.querySelector(".reply-preview-text");
  if (!preview) {
    preview = document.createElement("span");
    preview.className = "reply-preview-text";
    banner.appendChild(preview);
  }
  let closeBtn = banner.querySelector(".reply-cancel-btn");
  if (!closeBtn) {
    closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "reply-cancel-btn";
    closeBtn.innerHTML = "✕";
    banner.appendChild(closeBtn);
  }
  closeBtn.addEventListener("click", clearReply);
  banner.addEventListener("click", (e) => {
    if (e.target.closest(".reply-cancel-btn")) return;
    if (replyTo && replyTo.id) focusMessageById(replyTo.id);
  });
  if (!existing && messageForm && messageForm.parentNode) {
    messageForm.parentNode.insertBefore(banner, messageForm);
  }
  return { banner, preview };
})();

function setReply(message) {
  replyTo = { id: message.id, from: message.from, text: message.text };
  const friend = findFriend(message.from);
  const fromLabel = friend ? getFriendDisplayName(friend) : message.from;
  const raw = String(message.text || "").replace(/\s+/g, " ").trim();
  const snippet = raw.length > 70 ? `${raw.slice(0, 70)}…` : raw;
  replyBanner.preview.textContent = `Replying to ${fromLabel}: "${snippet}"`;
  replyBanner.banner.dataset.replyId = message.id || "";
  replyBanner.banner.classList.remove("hidden");
  messageInput.focus();
}

function clearReply() {
  replyTo = null;
  replyBanner.banner.classList.add("hidden");
  replyBanner.preview.textContent = "";
  replyBanner.banner.dataset.replyId = "";
}

const messageContextMenu = (() => {
  const menu = document.createElement("div");
  menu.id = "messageContextMenu";
  menu.className = "message-context-menu hidden";
  menu.innerHTML = `
    <button type="button" data-action="copy">Copy</button>
    <button type="button" data-action="reply">Reply</button>
    <button type="button" data-action="react">React</button>
    <button type="button" data-action="delete" class="danger">Delete</button>
  `;
  document.body.appendChild(menu);

  let currentMessageEl = null;

  function close() {
    menu.classList.add("hidden");
    currentMessageEl = null;
  }

  function getMessagePeer(msgEl) {
    let target = String(msgEl?.dataset?.messageFrom || "").trim();
    if (normalizeName(target) === normalizeName(me)) {
      target = activeFriend;
    }
    return target;
  }

  function open(msgEl, x, y) {
    if (!msgEl) return;
    currentMessageEl = msgEl;

    const mine = msgEl.classList.contains("me");
    const deleted = msgEl.classList.contains("message-deleted");
    const deleteBtn = menu.querySelector('[data-action="delete"]');
    const copyBtn = menu.querySelector('[data-action="copy"]');
    const replyBtn = menu.querySelector('[data-action="reply"]');
    const reactBtn = menu.querySelector('[data-action="react"]');

    if (deleteBtn) deleteBtn.classList.toggle("hidden", !mine || deleted);
    if (copyBtn) copyBtn.classList.toggle("hidden", deleted);
    if (replyBtn) replyBtn.classList.toggle("hidden", deleted);
    if (reactBtn) reactBtn.classList.toggle("hidden", deleted);

    menu.classList.remove("hidden");
    menu.style.left = "0px";
    menu.style.top = "0px";

    const rect = menu.getBoundingClientRect();
    const margin = 8;
    let left = x;
    let top = y;

    if (left + rect.width > window.innerWidth - margin) {
      left = window.innerWidth - rect.width - margin;
    }
    if (top + rect.height > window.innerHeight - margin) {
      top = window.innerHeight - rect.height - margin;
    }
    if (left < margin) left = margin;
    if (top < margin) top = margin;

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  menu.addEventListener("click", async (e) => {
    const actionBtn = e.target.closest("button[data-action]");
    if (!actionBtn || !currentMessageEl) return;

    const action = actionBtn.dataset.action;
    const messageId = currentMessageEl.dataset.messageId;
    const messageText = currentMessageEl.dataset.messageText || "";
    const targetPeer = getMessagePeer(currentMessageEl);

    if (action === "copy") {
      try {
        await navigator.clipboard.writeText(messageText);
        showToast("Message copied");
      } catch (_) {
        showToast("Could not copy message", "error");
      }
      close();
      return;
    }

    if (action === "reply") {
      setReply({
        id: messageId,
        from: currentMessageEl.dataset.messageFrom || "",
        text: messageText,
      });
      close();
      return;
    }

    if (action === "react") {
      const reactBtn = currentMessageEl.querySelector('[data-msg-action="react"]');
      if (reactBtn) reactBtn.click();
      close();
      return;
    }

    if (action === "delete") {
      if (!messageId || !targetPeer) {
        close();
        return;
      }
      socket.emit("delete_message", { messageId, to: targetPeer });
      close();
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#messageContextMenu")) close();
  });
  window.addEventListener("resize", close);
  messagesEl.addEventListener("scroll", close, { passive: true });

  messagesEl.addEventListener("contextmenu", (e) => {
    const msgEl = e.target.closest("article.message");
    if (!msgEl) return;
    e.preventDefault();
    open(msgEl, e.clientX, e.clientY);
  });

  let longPressTimer = null;
  let longPressTarget = null;
  let longPressStartX = 0;
  let longPressStartY = 0;

  function clearLongPress() {
    if (longPressTimer) clearTimeout(longPressTimer);
    longPressTimer = null;
    longPressTarget = null;
  }

  messagesEl.addEventListener("pointerdown", (e) => {
    const msgEl = e.target.closest("article.message");
    if (!msgEl) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    longPressTarget = msgEl;
    longPressStartX = e.clientX;
    longPressStartY = e.clientY;
    longPressTimer = setTimeout(() => {
      if (!longPressTarget) return;
      open(longPressTarget, longPressStartX, longPressStartY);
      clearLongPress();
    }, 520);
  });
  messagesEl.addEventListener("pointermove", (e) => {
    if (!longPressTimer) return;
    const dx = Math.abs(e.clientX - longPressStartX);
    const dy = Math.abs(e.clientY - longPressStartY);
    if (dx > 8 || dy > 8) clearLongPress();
  });
  messagesEl.addEventListener("pointerup", clearLongPress);
  messagesEl.addEventListener("pointercancel", clearLongPress);

  return { open, close };
})();

function renderMessagesEmptyState(text) {
  clearMessages();
  messageWindowStart = 0;
  messageWindowEnd = 0;
  loadOlderBtn = null;
  hideTypingIndicator();

  const hint = text || EMPTY_CONVERSATION_HINT;
  let title = "Your inbox is ready";

  if (/loading conversation/i.test(hint)) {
    title = "Opening conversation";
  } else if (/no messages yet/i.test(hint) && activeFriend) {
    title = `Start chatting with @${activeFriend}`;
  }

  const empty = document.createElement("div");
  empty.className = "messages-empty";

  const icon = document.createElement("div");
  icon.className = "messages-empty-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  `;

  const titleEl = document.createElement("p");
  titleEl.className = "messages-empty-title";
  titleEl.textContent = title;

  const sub = document.createElement("p");
  sub.className = "messages-empty-sub";
  sub.textContent = hint;

  empty.append(icon, titleEl, sub);
  messagesEl.appendChild(empty);
  applyMessageSearch();
}

function renderMineMessageMeta(metaEl, timeText, statusKey) {
  metaEl.innerHTML = "";
  metaEl.classList.add("mine");
  metaEl.dataset.time = timeText;
  metaEl.dataset.status = statusKey;

  const time = document.createElement("span");
  time.className = "message-meta-time";
  time.textContent = timeText;

  const status = document.createElement("span");
  status.className = `message-status message-status-${statusKey}`;

  if (statusKey === "pending") {
    status.textContent = "…";
    metaEl.append(time, status);
    return;
  }

  const tickA = document.createElement("span");
  tickA.className = "tick";
  tickA.textContent = "✓";
  status.appendChild(tickA);
  if (statusKey === "seen") {
    const tickB = document.createElement("span");
    tickB.className = "tick";
    tickB.textContent = "✓";
    status.appendChild(tickB);
  }
  metaEl.append(time, status);
}

function renderIncomingMessageMeta(metaEl, message) {
  metaEl.classList.remove("mine");
  metaEl.innerHTML = "";
  const time = prettyTime(message.timestamp);
  const friend = findFriend(message.from);
  const senderName = friend ? getFriendDisplayName(friend) : message.from;
  metaEl.textContent = `${senderName} · ${time}`;
}

function appendMessageTextWithLinks(container, text) {
  const raw = String(text || "");
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[\/?#][^\s<]*)?/gi;
  const parts = raw.split(urlRegex);
  const matches = raw.match(urlRegex) || [];
  if (!matches.length) {
    container.textContent = raw;
    return;
  }
  for (let i = 0; i < parts.length; i += 1) {
    if (parts[i]) container.appendChild(document.createTextNode(parts[i]));
    if (matches[i]) {
      const link = document.createElement("a");
      link.className = "message-link";
      const href = /^https?:\/\//i.test(matches[i]) ? matches[i] : `https://${matches[i]}`;
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = matches[i];
      link.addEventListener("click", (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();
        openExternalLink(href);
      });
      container.appendChild(link);
    }
  }
}

function focusMessageById(messageId) {
  if (!messageId || !messagesEl) return;
  const orig = messagesEl.querySelector(`[data-message-id="${messageId}"]`);
  if (orig) {
    orig.scrollIntoView({ behavior: "smooth", block: "center" });
    orig.classList.add("highlight-flash");
    setTimeout(() => orig.classList.remove("highlight-flash"), 1200);
  }
}

function buildMessageElement(message, skipAnimation = false) {
  const mine = normalizeName(message.from) === normalizeName(me);
  const isDeleted = Boolean(message.deletedAt);
  const rawText = isDeleted ? DELETED_MESSAGE_TEXT : message.text;
  const callLog = !isDeleted ? parseCallLogPayload(rawText) : null;
  const displayText = callLog ? formatCallLogPreview(rawText, mine) : rawText;
  const dateKey = getLocalDateKey(message.timestamp);
  const fullTimestamp = formatFullTimestamp(message.timestamp);

  const row       = document.createElement("article");
  row.className   = `message ${mine ? "me" : "them"}${skipAnimation ? " no-anim" : ""}`;
  if (message.id) row.dataset.messageId = message.id;
  if (message.clientTempId) row.dataset.clientTempId = message.clientTempId;
  row.dataset.dateKey = dateKey;
  row.dataset.timestamp = message.timestamp || "";
  row.dataset.tsFull = fullTimestamp;
  if (fullTimestamp) row.title = fullTimestamp;
  row.dataset.messageFrom = message.from;
  row.dataset.messageText = displayText || "";
  row.dataset.searchText = [
    row.dataset.messageFrom,
    displayText || "",
    message.replyTo?.text || "",
    message.replyTo?.from || "",
  ].join(" ");
  if (isDeleted) {
    row.classList.add("message-deleted");
  }
  if (message.pending) {
    row.classList.add("pending");
  }
  if (callLog) {
    row.classList.add("call-log");
  }

  if (message.reactions && Object.keys(message.reactions).length) {
    try {
      row.dataset.messageReactions = JSON.stringify(message.reactions);
    } catch (_) {
      // Ignore serialization errors for malformed payloads.
    }
  }

  if (!callLog) {
    const meta        = document.createElement("span");
    meta.className    = "message-meta";
    if (mine) {
      row.dataset.timeLabel = prettyTime(message.timestamp);
      renderMineMessageMeta(meta, row.dataset.timeLabel, getMessageStatusKey(message));
    } else {
      renderIncomingMessageMeta(meta, message);
    }
    row.append(meta);
  }

  if (message.replyTo && !isDeleted) {
    const rq      = document.createElement("div");
    rq.className  = "reply-quote";
    const ra      = document.createElement("span");
    ra.className  = "reply-quote-author";
    const replyAuthor = findFriend(message.replyTo.from);
    ra.textContent = replyAuthor
      ? getFriendDisplayName(replyAuthor)
      : message.replyTo.from;
    const rt      = document.createElement("span");
    rt.className  = "reply-quote-text";
    rt.textContent = message.replyTo.text.slice(0, 80) + (message.replyTo.text.length > 80 ? "…" : "");
    rq.addEventListener("click", () => {
      focusMessageById(message.replyTo.id);
    });
    rq.append(ra, rt);
    row.append(rq);
  }

  const body        = document.createElement("div");
  body.className    = "message-body";
  if (isDeleted) {
    body.textContent = DELETED_MESSAGE_TEXT;
    body.classList.add("message-body-deleted");
  } else {
    const trimmedText = String(message.text || "").trim();
    const isAudio = /^\/uploads\/.+\.(webm|wav|mp3|ogg)(\?.*)?$/i.test(trimmedText) ||
      /^https?:\/\/.+\.(webm|wav|mp3|ogg)(\?.*)?$/i.test(trimmedText);
    if (callLog) {
      const log = getCallLogDisplay(callLog, mine);
      const card = document.createElement("div");
      card.className = `call-log-card ${log.direction === "incoming" ? "incoming" : "outgoing"}`;

      const icon = document.createElement("div");
      icon.className = "call-log-icon";
      icon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 9.81 19.79 19.79 0 01.22 1.2 2 2 0 012.22 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16h-.08z"/></svg>`;

      const content = document.createElement("div");
      content.className = "call-log-content";
      const title = document.createElement("div");
      title.className = "call-log-title";
      title.textContent = log.title;
      const subtitle = document.createElement("div");
      subtitle.className = "call-log-subtitle";
      subtitle.textContent = log.subtitle;
      const status = document.createElement("div");
      const isBadStatus = ["cancelled", "declined", "missed", "busy", "unavailable"].includes(log.status);
      const isNeutralStatus = log.status === "ended";
      const statusClass = isNeutralStatus ? "neutral" : (isBadStatus ? "bad" : "good");
      status.className = `call-status-pill ${statusClass}`;
      status.textContent = log.statusLabel || "Call";
      content.append(title, subtitle, status);

      const time = document.createElement("div");
      time.className = "call-log-time";
      time.textContent = prettyTime(message.timestamp);

      card.append(icon, content, time);
      body.appendChild(card);
    } else if (isAudio) {
      body.classList.add("message-audio");
      const audioCard = document.createElement("div");
      audioCard.className = "audio-card";

      const playBtn = document.createElement("button");
      playBtn.type = "button";
      playBtn.className = "audio-play";
      playBtn.setAttribute("aria-label", "Play voice message");
      playBtn.innerHTML = `
        <svg class="icon-play" viewBox="0 0 24 24" aria-hidden="true"><polygon points="8 5 19 12 8 19 8 5"/></svg>
        <svg class="icon-pause" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
      `;

      const waveform = document.createElement("div");
      waveform.className = "audio-waveform";
      const seedValue = message.id || message.clientTempId || message.timestamp || trimmedText;
      buildWaveform(waveform, hashStringToSeed(seedValue));

      const time = document.createElement("span");
      time.className = "audio-time";
      time.textContent = "0:00 / 0:00";

      const audio = document.createElement("audio");
      audio.className = "audio-el";
      audio.preload = "metadata";
      audio.src = trimmedText;
      audio.setAttribute("playsinline", "");

      const syncUI = () => {
        const cur = audio.currentTime || 0;
        const dur = getAudioDuration(audio);
        time.textContent = `${formatAudioTime(cur)} / ${formatAudioTime(dur)}`;
        const pct = dur > 0 ? (cur / dur) : 0;
        updateWaveformProgress(waveform, pct);
      };

      audio.addEventListener("loadedmetadata", syncUI);
      audio.addEventListener("loadeddata", syncUI);
      audio.addEventListener("durationchange", syncUI);
      audio.addEventListener("canplay", syncUI);
      audio.addEventListener("timeupdate", syncUI);
      updateWaveformProgress(waveform, 0);
      audio.addEventListener("ended", () => {
        audioCard.classList.remove("is-playing");
        updateWaveformProgress(waveform, 0);
        syncUI();
      });
      audio.addEventListener("play", () => audioCard.classList.add("is-playing"));
      audio.addEventListener("pause", () => audioCard.classList.remove("is-playing"));

      playBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (audio.paused) {
          if (window._novynAudio && window._novynAudio !== audio) {
            window._novynAudio.pause();
          }
          window._novynAudio = audio;
          audio.play();
        } else {
          audio.pause();
        }
      });

      waveform.addEventListener("pointerdown", (e) => {
        const dur = getAudioDuration(audio);
        if (!Number.isFinite(dur) || dur <= 0) return;
        const rect = waveform.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        audio.currentTime = Math.max(0, Math.min(dur, pct * dur));
        syncUI();
      });

      audioCard.append(playBtn, waveform, time, audio);
      body.appendChild(audioCard);
      try { audio.load(); } catch (_) {}
    } else {
      appendMessageTextWithLinks(body, message.text);
      body.dataset.rawText = message.text;
    }
  }

  row.append(body);
  return row;
}

function appendMessage(message, skipAnimation = false, withSeparator = true, skipSearch = false) {
  const emptyNode = messagesEl.querySelector(".messages-empty");
  if (emptyNode) emptyNode.remove();
  const preserveTop = messagesEl.scrollTop;
  const shouldAutoScroll = shouldAutoScrollForMessage(message, skipAnimation);

  if (withSeparator) {
    appendDateSeparator(message.timestamp);
  }

  const row = buildMessageElement(message, skipAnimation);

  messagesEl.appendChild(row);
  if (!skipSearch) applyMessageSearch();
  if (shouldAutoScroll) {
    const mine = normalizeName(message.from) === normalizeName(me);
    scrollToBottom(skipAnimation || mine);
    scrollState.pinnedToBottom = true;
  } else {
    messagesEl.scrollTop = preserveTop;
  }

  syncProfilePanelStats();
  syncCallLogPanel();
}

function ensureLoadOlderButton() {
  if (!messagesEl) return null;
  if (!loadOlderBtn) {
    loadOlderBtn = document.createElement("button");
    loadOlderBtn.type = "button";
    loadOlderBtn.className = "messages-load-older hidden";
    loadOlderBtn.textContent = "Load older messages";
    loadOlderBtn.addEventListener("click", loadOlderMessages);
  }
  if (!loadOlderBtn.parentNode) {
    messagesEl.prepend(loadOlderBtn);
  }
  return loadOlderBtn;
}

function updateLoadOlderButton() {
  const btn = ensureLoadOlderButton();
  if (!btn) return;
  btn.classList.toggle("hidden", messageWindowStart <= 0);
}

function setMessageWindowToLatest() {
  messageWindowEnd = conversationMessages.length;
  messageWindowStart = Math.max(0, messageWindowEnd - MAX_VISIBLE_MESSAGES);
}

function renderMessageWindow(options = {}) {
  if (!messagesEl) return;
  const preserveScroll = options.preserveScroll;
  const prevScrollTop = preserveScroll ? messagesEl.scrollTop : 0;
  const prevScrollHeight = preserveScroll ? messagesEl.scrollHeight : 0;
  clearMessages();
  ensureLoadOlderButton();

  if (!Number.isFinite(messageWindowEnd) || messageWindowEnd <= 0) {
    messageWindowEnd = conversationMessages.length;
  }
  messageWindowEnd = Math.min(conversationMessages.length, messageWindowEnd);
  if (messageWindowEnd - messageWindowStart > MAX_VISIBLE_MESSAGES) {
    messageWindowStart = Math.max(0, messageWindowEnd - MAX_VISIBLE_MESSAGES);
  }

  for (let i = messageWindowStart; i < messageWindowEnd; i += 1) {
    const msg = conversationMessages[i];
    if (!msg) continue;
    if (options.withSeparator !== false) appendDateSeparator(msg.timestamp);
    const row = buildMessageElement(msg, true);
    messagesEl.appendChild(row);
  }

  updateLoadOlderButton();
  if (!options.skipSearch) applyMessageSearch();
  if (preserveScroll) {
    const nextHeight = messagesEl.scrollHeight;
    const delta = nextHeight - prevScrollHeight;
    messagesEl.scrollTop = prevScrollTop + delta;
  }
}

function loadOlderMessages() {
  if (messageWindowStart <= 0) return;
  messageWindowStart = Math.max(0, messageWindowStart - MESSAGE_WINDOW_PAGE);
  messageWindowEnd = Math.min(conversationMessages.length, messageWindowStart + MAX_VISIBLE_MESSAGES);
  renderMessageWindow({ preserveScroll: true });
}

function hasNewerMessages() {
  return messageWindowEnd < conversationMessages.length;
}

function showLatestMessages() {
  setMessageWindowToLatest();
  renderMessageWindow();
  scrollToBottom(true);
  scrollState.pinnedToBottom = true;
}

function updateStats() {
  if (requestCount) {
    requestCount.textContent = String(requests.length);
    requestCount.classList.toggle("has-pending", requests.length > 0);
  }
  if (friendCount)  friendCount.textContent  = String(friends.length);
  if (onlineCount) {
    const online = friends.filter((f) => f.online).length;
    onlineCount.textContent = `${online} online`;
  }
}

function setComposerEnabled(isEnabled) {
  messageInput.disabled = !isEnabled;
  if (sendButton) sendButton.disabled = !isEnabled;
  if (voiceBtn) {
    voiceBtn.disabled = !isEnabled;
    if (!isEnabled) resetVoiceState();
  }

  if (!isEnabled) {
    stopLocalTyping();
    hideTypingIndicator();
  }

  messageInput.placeholder = "Type a message…";
}

function scrollToUnreadStart() {
  if (!messagesEl) return false;
  if (getSearchQuery()) return false;
  if (!pendingUnreadJump.count) return false;
  if (!activeFriend || normalizeName(activeFriend) !== pendingUnreadJump.friendKey) return false;

  const incoming = Array.from(messagesEl.querySelectorAll("article.message.them"));
  if (!incoming.length) {
    pendingUnreadJump = { friendKey: "", count: 0 };
    return false;
  }

  const index = Math.max(0, incoming.length - pendingUnreadJump.count);
  const target = incoming[index] || incoming[0];
  if (!target) {
    pendingUnreadJump = { friendKey: "", count: 0 };
    return false;
  }

  target.scrollIntoView({ behavior: "auto", block: "start" });
  target.classList.add("highlight-flash");
  setTimeout(() => target.classList.remove("highlight-flash"), 1200);
  scrollState.pinnedToBottom = false;
  pendingUnreadJump = { friendKey: "", count: 0 };
  return true;
}

function renderMessages(messages) {
  conversationMessages = Array.isArray(messages) ? messages.slice() : [];

  if (!conversationMessages.length) {
    renderMessagesEmptyState("No messages yet. Say hello!");
    applyMessageSearch();
    syncProfilePanelStats();
    syncCallLogPanel();
    return;
  }

  setMessageWindowToLatest();
  renderMessageWindow({ skipSearch: true });

  // Jump to first unread message when available, otherwise bottom
  const jumpedToUnread = scrollToUnreadStart();
  if (!jumpedToUnread) {
    scrollToBottom(true);
    scrollState.pinnedToBottom = true;
  }
  if (window._novynFAB) window._novynFAB.reset();
  applyMessageSearch();
  syncProfilePanelStats();
  syncCallLogPanel();
}

function markConversationMessageDeleted(messageId, deletedAt, replacementText = DELETED_MESSAGE_TEXT) {
  for (const message of conversationMessages) {
    if (message.id !== messageId) continue;
    message.deletedAt = deletedAt || message.deletedAt || new Date().toISOString();
    message.text = replacementText;
    message.reactions = {};
    break;
  }
}

function applyDeletedMessageToDom(messageId, replacementText = DELETED_MESSAGE_TEXT) {
  const row = messagesEl.querySelector(`[data-message-id="${messageId}"]`);
  if (!row) return;

  row.classList.add("message-deleted");
  row.dataset.messageText = replacementText;
  row.dataset.searchText = `${row.dataset.messageFrom || ""} ${replacementText}`;

  const body = row.querySelector(".message-body");
  if (body) {
    body.textContent = replacementText;
    body.classList.add("message-body-deleted");
    body.dataset.rawText = replacementText;
  }

  const replyQuote = row.querySelector(".reply-quote");
  if (replyQuote) replyQuote.remove();

  const actions = row.querySelector(".msg-actions");
  if (actions) actions.remove();

  const reactions = row.querySelector(".message-reactions");
  if (reactions) reactions.innerHTML = "";
}

function requestDiscoverOnline() {
  if (!socket || !socket.emit) return;
  if (!isDashboardPage || !me) return;
  socket.emit("discover_online");
}

function setDiscoverUsers(list) {
  discoverUsers = Array.isArray(list) ? list.slice() : [];
  renderDiscover();
}

function renderDiscover() {
  if (!discoverPanel || !discoverList) return;
  discoverList.innerHTML = "";
  const meKey = normalizeName(me);
  const friendKeys = new Set(friends.map((friend) => normalizeName(friend.username)));
  const requestKeys = new Set(requests.map((name) => normalizeName(name)));
  const query = friendSearchQuery;
  const filtered = discoverUsers.filter((user) => {
    const username = String(user?.username || "").trim();
    if (!username) return false;
    const key = normalizeName(username);
    if (!key || key === meKey) return false;
    if (friendKeys.has(key) || requestKeys.has(key)) return false;
    if (query) {
      const searchBlob = normalizeSearchText(`${user?.displayName || ""} ${username} ${user?.bio || ""}`);
      if (!searchBlob.includes(query)) return false;
    }
    return true;
  });
  if (discoverEmpty) {
    discoverEmpty.style.display = filtered.length ? "none" : "";
  }
  if (!filtered.length) return;

  filtered.forEach((user) => {
    const item = document.createElement("div");
    item.className = "discover-item";

    const avatar = document.createElement("div");
    avatar.className = "discover-avatar";
    const fallback = String(user?.username || "").slice(0, 2).toUpperCase();
    if (user?.avatarId && window._novynAvatarUtils) {
      window._novynAvatarUtils.applyAvatarToEl(avatar, user.avatarId, fallback || "?");
    } else {
      avatar.textContent = fallback || "?";
    }

    const meta = document.createElement("div");
    meta.className = "discover-meta";
    const name = document.createElement("div");
    name.className = "discover-name";
    const displayName = cleanDisplayName(user?.displayName);
    name.textContent = displayName || user?.username || "User";
    const sub = document.createElement("div");
    sub.className = "discover-sub";
    const bio = cleanDisplayName(user?.bio);
    sub.textContent = bio ? `Online now · ${bio}` : "Online now";
    meta.append(name, sub);

    const action = document.createElement("button");
    action.className = "discover-action";
    action.type = "button";
    action.textContent = "Add";
    action.addEventListener("click", () => {
      if (action.disabled) return;
      action.disabled = true;
      action.classList.add("is-disabled");
      action.textContent = "Requested";
      if (user?.username) socket.emit("add_friend", user.username);
    });

    item.append(avatar, meta, action);
    discoverList.appendChild(item);
  });
}


// ─── Requests ────────────────────────────────────────────────────────────────

function renderRequests() {
  if (!requestList) return;
  requestList.innerHTML = "";
  updateStats();
  updateRequestsBadge();

  const query = friendSearchQuery;
  const filteredRequests = query
    ? requests.filter((name) => normalizeSearchText(name).includes(query))
    : requests;

  if (!filteredRequests.length) {
    const empty       = document.createElement("li");
    empty.className   = "item-card list-empty";
    empty.textContent = requests.length
      ? `No requests match "${friendSearchQuery}"`
      : "No pending requests";
    requestList.appendChild(empty);
    return;
  }

  for (const username of filteredRequests) {
    const li      = document.createElement("li");
    li.className  = "request-card";

    const name        = document.createElement("span");
    name.className    = "request-name";
    name.textContent  = username;

    const btn       = document.createElement("button");
    btn.type        = "button";
    btn.className   = "req-btn accept";
    btn.textContent = "Accept";
    btn.addEventListener("click", () => socket.emit("accept_friend", username));

    li.append(name, btn);
    requestList.appendChild(li);
  }
}

// ─── Friends ──────────────────────────────────────────────────────────────────

function friendPreview(friend) {
  if (!friend.lastMessage) {
    const bio = cleanDisplayName(friend?.bio);
    if (bio) return bio;
    return friend.online ? "Online now" : "No messages yet";
  }
  const fromMe = normalizeName(friend.lastFrom) === normalizeName(me);
  const callPreview = formatCallLogPreview(friend.lastMessage, fromMe);
  const previewText = callPreview || friend.lastMessage;
  if (fromMe) {
    return `You: ${previewText}`;
  }
  if (friend.lastFrom) {
    return `${getFriendDisplayName(friend)}: ${previewText}`;
  }
  return previewText;
}

function findFriend(username) {
  return friends.find(
    (friend) => normalizeName(friend.username) === normalizeName(username)
  );
}

function setInfoPanelStatus(text, state) {
  if (!infoPanelStatus) return;
  infoPanelStatus.textContent = text;
  infoPanelStatus.classList.remove("online", "offline", "me");
  if (state) infoPanelStatus.classList.add(state);
}

function applyInfoAvatar(avatarEl, avatarId, fallbackText) {
  if (!avatarEl) return;
  const utils = window._novynAvatarUtils;
  if (utils && avatarId) {
    utils.applyAvatarToEl(avatarEl, avatarId, fallbackText);
    return;
  }
  avatarEl.style.background = "";
  avatarEl.textContent = fallbackText || "?";
}

function maybeResetInfoPanelScroll() {
  if (!document.body || !document.body.classList.contains("info-open")) return;
  const nextKey = activeFriend ? normalizeName(activeFriend) : "me";
  if (!nextKey || nextKey === lastInfoPanelFriendKey) return;
  const inner = document.querySelector(".info-inner");
  if (inner) inner.scrollTop = 0;
  lastInfoPanelFriendKey = nextKey;
}

function syncInfoPanel() {
  if (!infoPanelName || !infoPanelAvatar || !infoPanelHandle || !infoPanelStatus) return;

  if (activeFriend) {
    const friend = findFriend(activeFriend);
    if (!friend) {
      infoPanelName.textContent = "Loading...";
      infoPanelHandle.textContent = "";
      setInfoPanelStatus("● Offline", "offline");
      maybeResetInfoPanelScroll();
      return;
    }

    infoPanelName.textContent = getFriendDisplayName(friend);
    infoPanelHandle.textContent = `@${friend.username}`;
    infoPanelHandle.title = `@${friend.username}`;
    applyInfoAvatar(
      infoPanelAvatar,
      friend.avatarId,
      friend.username.slice(0, 2).toUpperCase()
    );
    setInfoPanelStatus(friend.online ? "● Online" : "● Offline", friend.online ? "online" : "offline");
    infoPanelStatus.title = friend.online ? "Online now" : formatLastSeen(friend.lastSeenAt);
    maybeResetInfoPanelScroll();
    return;
  }

  const myName = getMyDisplayName();
  infoPanelName.textContent = myName;
  infoPanelHandle.textContent = me ? `@${me}` : "@you";
  infoPanelHandle.title = me ? `@${me}` : "@you";
  applyInfoAvatar(infoPanelAvatar, myProfile.avatarId, (me || "You").slice(0, 2).toUpperCase());
  setInfoPanelStatus("● You", "me");
  infoPanelStatus.title = "Your profile";
  maybeResetInfoPanelScroll();
}


function renderActiveFriendPresence() {
  if (document.body) {
    document.body.classList.toggle("friend-selected", Boolean(activeFriend));
  }
  if (!activeFriend) {
    document.body.classList.remove("info-open");
  }
  syncInfoPanel();

  if (!activePresence || !activeFriendAvatar) return;

  if (!activeFriend) {
    activePresence.classList.add("hidden");
    activeFriendAvatar.classList.remove("online");
    activeFriendAvatar.textContent = "?";
    activeFriendAvatar.style.background = "";
    if (activeFriendPresenceLine) {
      activeFriendPresenceLine.textContent = "Select a friend to start chatting";
      activeFriendPresenceLine.classList.remove("online", "offline");
    }
    syncProfilePanel();
    return;
  }

  const friend = findFriend(activeFriend);
  if (!friend) {
    activePresence.classList.add("hidden");
    if (activeFriendPresenceLine) {
      activeFriendPresenceLine.textContent = "Loading contact status...";
      activeFriendPresenceLine.classList.remove("online", "offline");
    }
    syncProfilePanel();
    return;
  }

  activePresence.classList.remove("hidden");
  activeFriendLabel.textContent = getFriendDisplayName(friend);
  activeFriendLabel.title = `@${friend.username}`;

  const fallback = friend.username.slice(0, 2).toUpperCase();
  if (friend.avatarId && window._novynAvatarUtils) {
    window._novynAvatarUtils.applyAvatarToEl(
      activeFriendAvatar,
      friend.avatarId,
      fallback
    );
  } else {
    activeFriendAvatar.style.background = "";
    activeFriendAvatar.textContent = fallback;
  }

  activeFriendAvatar.classList.toggle("online", !!friend.online);
  activeFriendAvatar.title = friend.online
    ? `${friend.username} is online`
    : `${friend.username} is offline`;

  if (activeFriendPresenceLine) {
    const statusText = friend.online ? "Online now" : formatLastSeen(friend.lastSeenAt);
    activeFriendPresenceLine.textContent = statusText;
    activeFriendPresenceLine.classList.toggle("online", !!friend.online);
    activeFriendPresenceLine.classList.toggle("offline", !friend.online);
  }

  syncProfilePanel(friend);
}

function syncRemoveFriendButton() {
  if (!removeFriendBtn) return;
  const hasActive = Boolean(activeFriend);
  removeFriendBtn.classList.toggle("hidden", !hasActive);
  removeFriendBtn.disabled = !hasActive;
  if (hasActive) {
    removeFriendBtn.title = `Unfriend @${activeFriend}`;
    removeFriendBtn.setAttribute("aria-label", `Unfriend ${activeFriend}`);
  } else {
    removeFriendBtn.title = "Unfriend";
    removeFriendBtn.setAttribute("aria-label", "Unfriend");
  }
}

function clearActiveFriendSelection() {
  if (activeFriend) stopLocalTyping(activeFriend);
  activeFriend = "";
  pendingUnreadJump = { friendKey: "", count: 0 };
  setActiveChatTarget("");
  conversationMessages = [];
  clearReply();
  resetMessageSearch();
  if (activeFriendLabel) {
    activeFriendLabel.textContent = "Select a conversation";
    activeFriendLabel.title = "";
  }
  if (activeFriendPresenceLine) {
    activeFriendPresenceLine.textContent = "Choose a friend to start messaging";
    activeFriendPresenceLine.classList.remove("online", "offline");
  }
  renderActiveFriendPresence();
  syncRemoveFriendButton();
  setComposerEnabled(false);
  renderMessagesEmptyState(EMPTY_CONVERSATION_HINT);
  renderFriends();
}

function setActiveFriend(username) {
  if (activeFriend && normalizeName(activeFriend) !== normalizeName(username)) {
    stopLocalTyping(activeFriend);
  }

  if (!username) {
    clearActiveFriendSelection();
    return;
  }

  if (username) {
    const friend = findFriend(username);
    pendingUnreadJump = {
      friendKey: normalizeName(username),
      count: Number(friend?.unreadCount) || 0,
    };
  } else {
    pendingUnreadJump = { friendKey: "", count: 0 };
  }

  activeFriend = username;
  setActiveChatTarget(username);
  conversationMessages = [];
  clearReply();
  resetMessageSearch();
  activeFriendLabel.textContent = "Loading...";
  renderActiveFriendPresence();
  syncRemoveFriendButton();
  setComposerEnabled(true);
  renderMessagesEmptyState("Loading conversation…");
  socket.emit("get_history", username);
  renderFriends();

  // Focus input after selecting friend (better UX, especially on desktop)
  if (messageInput) {
    setTimeout(() => messageInput.focus(), 50);
  }
}

function renderFriends() {
  if (!friendList) return;
  friendList.innerHTML = "";
  updateStats();

  const isContactsView = sidebarView === "contacts";
  const isMessagesView = sidebarView === "messages";
  const query = friendSearchQuery;
  const filteredFriends = query
    ? friends.filter((friend) => getFriendSearchBlob(friend).includes(query))
    : friends;
  const sortedFriends = filteredFriends.slice().sort((a, b) => {
    if (sidebarView === "contacts") {
      return getFriendDisplayName(a).localeCompare(getFriendDisplayName(b));
    }
    const aTs = a.lastTimestamp || "";
    const bTs = b.lastTimestamp || "";
    if (aTs && bTs) return bTs.localeCompare(aTs);
    if (aTs) return -1;
    if (bTs) return 1;
    return String(a.username || "").localeCompare(String(b.username || ""));
  });

  if (!sortedFriends.length) {
    const empty       = document.createElement("li");
    empty.className   = "item-card list-empty";
    empty.textContent = friends.length
      ? `No friends match "${friendSearchQuery}"`
      : "No friends yet — add one above";
    friendList.appendChild(empty);
    renderActiveFriendPresence();
    syncRemoveFriendButton();
    return;
  }

  const renderFriendRow = (friend) => {
    const li      = document.createElement("li");
    li.className  = "item-card";

    const btn         = document.createElement("button");
    btn.type          = "button";
    btn.className     = `friend-btn chat-item${normalizeName(activeFriend) === normalizeName(friend.username) ? " active" : ""}`;
    btn.dataset.username = friend.username;

    // Avatar with initials + online dot
    const avatar        = document.createElement("div");
    avatar.className    = `friend-avatar chat-av av-default${friend.online ? " online" : ""}`;
    if (friend.avatarId && window._novynAvatarUtils) {
      window._novynAvatarUtils.applyAvatarToEl(avatar, friend.avatarId, friend.username.slice(0, 2).toUpperCase());
    } else {
      avatar.textContent = friend.username.slice(0, 2).toUpperCase();
    }
    btn.appendChild(avatar);

    const main      = document.createElement("div");
    main.className  = "friend-main chat-info";

    const name        = document.createElement("span");
    name.className    = "friend-name chat-name";
    name.textContent  = getFriendDisplayName(friend);
    if (displayDiffersFromUsername(friend)) {
      name.title = `${getFriendDisplayName(friend)} (@${friend.username})`;
    } else {
      name.title = friend.username;
    }

    const preview = document.createElement("span");
    preview.className = "chat-preview";
    preview.textContent = (isContactsView || isMessagesView) ? getFriendPresenceText(friend) : friendPreview(friend);
    preview.title = preview.textContent;
    if (isContactsView || isMessagesView) {
      preview.classList.toggle("status-online", !!friend.online);
      preview.classList.toggle("status-offline", !friend.online);
    }

    main.append(name, preview);

    if (!isContactsView) {
      const side      = document.createElement("div");
      side.className  = "friend-side chat-right";

      if (!isMessagesView) {
        const timeText = formatFriendTime(friend.lastTimestamp);
        if (timeText) {
          const time = document.createElement("span");
          time.className = "chat-time";
          time.textContent = timeText;
          side.appendChild(time);
        }
      }
      const unreadCount = Number(friend.unreadCount) || 0;
      if (unreadCount > 0) {
        const unread        = document.createElement("span");
        unread.className    = "unread-badge";
        unread.textContent  = unreadCount > 99 ? "99+" : String(unreadCount);
        side.appendChild(unread);
      }

      if (side.childNodes.length) {
        btn.append(main, side);
      } else {
        btn.append(main);
      }
    } else {
      btn.append(main);
    }
    li.appendChild(btn);
    friendList.appendChild(li);
  };

  if (isContactsView) {
    const grouped = { online: [], away: [], offline: [] };
    sortedFriends.forEach((friend) => {
      const bucket = getContactBucket(friend);
      if (grouped[bucket]) grouped[bucket].push(friend);
    });
    const order = ["online", "away", "offline"];
    const labels = { online: "Online", away: "Away", offline: "Offline" };

    order.forEach((bucket) => {
      const list = grouped[bucket];
      if (!list || !list.length) return;
      const label = document.createElement("li");
      label.className = "contact-section-label";
      label.textContent = `${labels[bucket]} — ${list.length}`;
      friendList.appendChild(label);
      list
        .slice()
        .sort((a, b) => getFriendDisplayName(a).localeCompare(getFriendDisplayName(b)))
        .forEach(renderFriendRow);
    });
  } else {
    sortedFriends.forEach(renderFriendRow);
  }

  renderActiveFriendPresence();
  syncRemoveFriendButton();
  renderCallHistory();
}

// ─── Form handlers ────────────────────────────────────────────────────────────

// ─── Login button spinner helpers ────────────────────────────────────────────
const loginBtn = document.getElementById("loginBtn");
const loginBtnText = loginBtn ? loginBtn.querySelector(".login-btn-text") : null;
const loginBtnArrow = loginBtn ? loginBtn.querySelector(".login-btn-arrow") : null;
const loginBtnSpinner = loginBtn ? loginBtn.querySelector(".login-btn-spinner") : null;

function setLoginLoading(isLoading) {
  if (!loginBtn) return;
  loginBtn.disabled = isLoading;
  if (loginBtnText)    loginBtnText.textContent = isLoading ? "Entering…" : "Sign In";
  if (loginBtnArrow)   loginBtnArrow.classList.toggle("hidden", isLoading);
  if (loginBtnSpinner) loginBtnSpinner.classList.toggle("hidden", !isLoading);
}

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearUsernameSuggestions();
    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    if (!username || !password) return;
    setLoginLoading(true);
    socket.emit("register", { username, password });
  });
}

// Clear suggestions as soon as the user starts editing
if (usernameInput) usernameInput.addEventListener("input", clearUsernameSuggestions);
if (passwordInput) passwordInput.addEventListener("input", clearUsernameSuggestions);

function requestFriendSuggestions(query) {
  if (!socketAvailable || !query) return;
  socket.emit("friend_search", { query });
}

if (addFriendForm) {
  addFriendForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = friendInput ? friendInput.value.trim() : "";
    if (!val) return;
    if (me && normalizeName(val) === normalizeName(me)) {
      showToast("You can't add yourself!", "error");
      return;
    }
    socket.emit("add_friend", val);
    if (friendInput) friendInput.value = "";
    clearFriendSuggestions();
  });
}

if (friendInput) {
  friendInput.addEventListener("input", () => {
    const val = friendInput.value.trim();
    if (!val || val.length < 2) {
      clearFriendSuggestions();
      friendSuggestState.lastQuery = "";
      if (friendSuggestState.timer) clearTimeout(friendSuggestState.timer);
      return;
    }
    if (friendSuggestState.timer) clearTimeout(friendSuggestState.timer);
    friendSuggestState.timer = setTimeout(() => {
      friendSuggestState.lastQuery = val;
      requestFriendSuggestions(val);
    }, 220);
  });
  friendInput.addEventListener("blur", () => {
    setTimeout(() => {
      clearFriendSuggestions();
    }, 160);
  });
}

if (sidebarSearch) {
  const applyFriendSearch = () => {
    friendSearchQuery = normalizeSearchText(sidebarSearch.value);
    renderRequests();
    renderFriends();
    renderCallHistory();
    renderDiscover();
  };
  sidebarSearch.addEventListener("input", applyFriendSearch);
  sidebarSearch.addEventListener("search", applyFriendSearch);
}

if (navRailButtons.length) {
  navRailButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const view = btn.dataset.rail || "";
      if (!view) return;
      if (view === "settings") {
        if (e) e.stopPropagation();
        setSettingsOpen(!settingsOpen);
        return;
      }
      switchRail(view);
    });
  });
  window.__novynNavBound = true;
}

if (callFilterButtons.length) {
  callFilterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.callFilter || "all";
      setCallFilter(filter);
    });
  });
}

if (settingsCloseBtn) {
  settingsCloseBtn.addEventListener("click", () => setSettingsOpen(false));
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && settingsOpen) {
    setSettingsOpen(false);
  }
});

if (mobBackBtn) {
  mobBackBtn.addEventListener("click", () => {
    clearActiveFriendSelection();
    showSidebarOnMobile();
  });
}

document.addEventListener("visibilitychange", () => {
  if (!isDashboardPage) return;
  if (document.hidden) {
    setActiveChatTarget("");
  } else if (activeFriend) {
    setActiveChatTarget(activeFriend);
  }
});

if (friendList) {
  const handleFriendActivate = (e) => {
    const btn = e.target.closest(".friend-btn");
    if (!btn) return;
    const username = btn.dataset.username;
    if (!username) return;
    e.preventDefault();
    setActiveFriend(username);
    showChatOnMobile();
  };
  friendList.addEventListener("click", handleFriendActivate);
}

// ─── Custom unfriend confirm modal ────────────────────────────────────────────
const unfriendModal  = document.getElementById("unfriendModal");
const unfriendCancel  = document.getElementById("unfriendCancel");
const unfriendConfirm = document.getElementById("unfriendConfirm");
const unfriendModalTitle = document.getElementById("unfriendModalTitle");
const unfriendModalDesc  = document.getElementById("unfriendModalDesc");
let pendingUnfriendTarget = "";
let unfriendFocusReturn = null;
let unfriendTrapCleanup = null;

function getModalFocusable(modal) {
  if (!modal) return [];
  const nodes = modal.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
  return Array.from(nodes).filter((el) => !el.disabled && el.offsetParent !== null);
}

function trapModalFocus(modal) {
  const onKey = (e) => {
    if (e.key !== "Tab") return;
    const focusable = getModalFocusable(modal);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  modal.addEventListener("keydown", onKey);
  return () => modal.removeEventListener("keydown", onKey);
}

function showUnfriendModal(target) {
  pendingUnfriendTarget = target;
  if (unfriendModalTitle) unfriendModalTitle.textContent = `Unfriend @${target}?`;
  if (unfriendModalDesc)  unfriendModalDesc.textContent  = `This will also clear your chat history with @${target}.`;
  if (unfriendModal) {
    unfriendFocusReturn = document.activeElement;
    unfriendModal.style.display = "flex";
    if (unfriendTrapCleanup) unfriendTrapCleanup();
    unfriendTrapCleanup = trapModalFocus(unfriendModal);
    const focusable = getModalFocusable(unfriendModal);
    if (focusable.length) focusable[0].focus();
  }
}
function hideUnfriendModal() {
  if (unfriendModal) unfriendModal.style.display = "none";
  if (unfriendTrapCleanup) {
    unfriendTrapCleanup();
    unfriendTrapCleanup = null;
  }
  if (unfriendFocusReturn && typeof unfriendFocusReturn.focus === "function") {
    unfriendFocusReturn.focus();
  }
  unfriendFocusReturn = null;
  pendingUnfriendTarget = "";
}

if (unfriendCancel)  unfriendCancel.addEventListener("click", hideUnfriendModal);
if (unfriendConfirm) unfriendConfirm.addEventListener("click", () => {
  if (pendingUnfriendTarget) socket.emit("remove_friend", pendingUnfriendTarget);
  hideUnfriendModal();
});
if (unfriendModal) {
  unfriendModal.querySelector(".confirm-modal-backdrop")
    ?.addEventListener("click", hideUnfriendModal);
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && unfriendModal && unfriendModal.style.display !== "none") {
    hideUnfriendModal();
  }
});

if (removeFriendBtn) {
  removeFriendBtn.addEventListener("click", () => {
    if (!activeFriend) return;
    showUnfriendModal(activeFriend);
  });
}

function keepComposerFocused() {
  if (!messageInput || messageInput.disabled) return;

  const refocus = () => {
    try {
      messageInput.focus({ preventScroll: true });
    } catch (_) {
      messageInput.focus();
    }
    const caretPos = messageInput.value.length;
    if (typeof messageInput.setSelectionRange === "function") {
      messageInput.setSelectionRange(caretPos, caretPos);
    }
  };

  // First immediate focus, then a delayed pass for mobile keyboards.
  refocus();
  setTimeout(refocus, 40);
}

const voiceState = {
  recorder: null,
  chunks: [],
  stream: null,
  timeout: null,
  isRecording: false,
  uploading: false,
  cancelNext: false,
  startedAt: 0,
  timerId: null,
  pendingTempId: "",
};

const ICE_SERVERS = window.NOVYN_ICE_SERVERS || [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];
const callState = {
  status: "idle",
  peer: "",
  pc: null,
  localStream: null,
  remoteStream: null,
  pendingOffer: null,
  pendingCandidates: [],
  isCaller: false,
  muted: false,
  speakerOn: true,
  mediaType: "audio",
  videoEnabled: true,
  videoFacing: "user",
  startedAt: 0,
  timerId: null,
  minimized: false,
  logSent: false,
  reconnectTimer: null,
};

function resetVoiceState() {
  if (voiceState.timeout) clearTimeout(voiceState.timeout);
  voiceState.timeout = null;
  if (voiceState.timerId) clearInterval(voiceState.timerId);
  voiceState.timerId = null;
  if (voiceState.recorder && voiceState.recorder.state !== "inactive") {
    voiceState.recorder.stop();
  }
  if (voiceState.stream) {
    voiceState.stream.getTracks().forEach((t) => t.stop());
  }
  voiceState.recorder = null;
  voiceState.stream = null;
  voiceState.chunks = [];
  voiceState.isRecording = false;
  voiceState.cancelNext = false;
  voiceState.startedAt = 0;
  voiceState.pendingTempId = "";
  if (voiceBtn) {
    voiceBtn.classList.remove("recording");
    voiceBtn.setAttribute("aria-pressed", "false");
    voiceBtn.disabled = messageInput?.disabled;
  }
  if (voiceStatus) voiceStatus.classList.add("hidden");
  if (voiceLabel) voiceLabel.textContent = "Recording...";
  if (voiceTimer) voiceTimer.textContent = "0:00";
  if (voiceProgress) voiceProgress.classList.add("hidden");
  if (voiceProgressBar) voiceProgressBar.style.transform = "scaleX(0)";
  if (voiceProgressText) voiceProgressText.textContent = "Uploading... 0%";
  if (voiceCancelBtn) voiceCancelBtn.disabled = false;
  if (voiceStopBtn) voiceStopBtn.disabled = false;
}

async function uploadVoiceBlob(blob) {
  if (!blob || !activeFriend) return;
  const targetFriend = activeFriend;
  voiceState.uploading = true;
  if (voiceStatus) voiceStatus.classList.remove("hidden");
  if (voiceLabel) voiceLabel.textContent = "Uploading...";
  if (voiceProgress) voiceProgress.classList.remove("hidden");
  if (voiceProgressBar) voiceProgressBar.style.transform = "scaleX(0)";
  if (voiceProgressText) voiceProgressText.textContent = "Uploading... 0%";
  if (voiceCancelBtn) voiceCancelBtn.disabled = true;
  if (voiceStopBtn) voiceStopBtn.disabled = true;
  if (targetFriend) {
    const tempId = createClientTempId();
    voiceState.pendingTempId = tempId;
    queuePendingMessage({ to: targetFriend, text: "Uploading voice message...", clientTempId: tempId }, { queue: false, updateFriends: false });
  }
  try {
    const formData = new FormData();
    formData.append("voice", blob, `voice-${Date.now()}.webm`);
    const data = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/upload-voice");
      xhr.upload.onprogress = (evt) => {
        if (!evt.lengthComputable) return;
        const pct = Math.max(0, Math.min(1, evt.loaded / evt.total));
        if (voiceProgressBar) voiceProgressBar.style.transform = `scaleX(${pct})`;
        if (voiceProgressText) voiceProgressText.textContent = `Uploading... ${Math.round(pct * 100)}%`;
      };
      xhr.onload = () => {
        const isOk = xhr.status >= 200 && xhr.status < 300;
        let payload = {};
        try { payload = JSON.parse(xhr.responseText || "{}"); } catch (_) {}
        if (!isOk) {
          reject(new Error(payload?.error || "Upload failed"));
          return;
        }
        resolve(payload);
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(formData);
    });
    if (!data?.url) throw new Error("No URL returned");
    if (voiceState.pendingTempId) {
      const tempId = voiceState.pendingTempId;
      voiceState.pendingTempId = "";
      updatePendingMessageText(tempId, data.url);
      const pendingMsg = pendingByTempId.get(tempId);
      if (pendingMsg) {
        friends = friends.map((f) =>
          normalizeName(f.username) === normalizeName(targetFriend)
            ? { ...f, lastMessage: pendingMsg.text, lastFrom: me, lastTimestamp: pendingMsg.timestamp }
            : f
        );
        renderFriends();
      }
      sendMessagePayload({ to: targetFriend, text: data.url, clientTempId: tempId }, { optimistic: false });
    } else {
      sendMessagePayload({ to: targetFriend, text: data.url });
    }
    showToast("Voice message sent", "success");
  } catch (err) {
    console.error(err);
    if (voiceState.pendingTempId) {
      removePendingMessage(voiceState.pendingTempId);
      voiceState.pendingTempId = "";
    }
    showToast("Voice upload failed", "error");
  } finally {
    voiceState.uploading = false;
    if (voiceProgress) voiceProgress.classList.add("hidden");
    if (voiceCancelBtn) voiceCancelBtn.disabled = false;
    if (voiceStopBtn) voiceStopBtn.disabled = false;
    if (voiceStatus) voiceStatus.classList.add("hidden");
  }
}

function stopVoiceRecording(cancelled = false) {
  if (!voiceState.isRecording) return;
  voiceState.isRecording = false;
  voiceState.cancelNext = cancelled;
  if (voiceState.timeout) clearTimeout(voiceState.timeout);
  voiceState.timeout = null;
  if (voiceState.recorder && voiceState.recorder.state !== "inactive") {
    voiceState.recorder.stop();
  }
  if (voiceBtn) {
    voiceBtn.classList.remove("recording");
    voiceBtn.setAttribute("aria-pressed", "false");
  }
}

async function startVoiceRecording() {
  if (!voiceBtn) return;
  if (!activeFriend) {
    showToast("Choose a friend before recording.", "error");
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast("Voice recording not supported in this browser.", "error");
    return;
  }
  if (voiceState.uploading) {
    showToast("Voice upload in progress. Please wait.", "info");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);

    voiceState.stream = stream;
    voiceState.recorder = recorder;
    voiceState.chunks = [];
    voiceState.isRecording = true;
    voiceState.cancelNext = false;
    voiceState.startedAt = Date.now();

    recorder.ondataavailable = (evt) => {
      if (evt?.data?.size > 0) voiceState.chunks.push(evt.data);
    };
    recorder.onstop = async () => {
      const blob = new Blob(voiceState.chunks, { type: "audio/webm" });
      const cancelled = voiceState.cancelNext;
      resetVoiceState();
      if (cancelled) {
        showToast("Recording discarded", "info");
        return;
      }
      await uploadVoiceBlob(blob);
    };

    recorder.start();
    voiceBtn.classList.add("recording");
    voiceBtn.setAttribute("aria-pressed", "true");
    voiceBtn.title = "Stop recording";
    if (voiceStatus) voiceStatus.classList.remove("hidden");
    if (voiceLabel) voiceLabel.textContent = "Recording...";
    if (voiceTimer) voiceTimer.textContent = "0:00";
    if (voiceProgress) voiceProgress.classList.add("hidden");
    if (voiceProgressBar) voiceProgressBar.style.transform = "scaleX(0)";
    if (voiceProgressText) voiceProgressText.textContent = "Uploading... 0%";
    if (voiceCancelBtn) voiceCancelBtn.disabled = false;
    if (voiceStopBtn) voiceStopBtn.disabled = false;

    if (voiceState.timerId) clearInterval(voiceState.timerId);
    voiceState.timerId = setInterval(() => {
      if (!voiceState.startedAt) return;
      const secs = Math.max(0, Math.floor((Date.now() - voiceState.startedAt) / 1000));
      const mins = Math.floor(secs / 60);
      const rem = String(secs % 60).padStart(2, "0");
      if (voiceTimer) voiceTimer.textContent = `${mins}:${rem}`;
    }, 500);

    voiceState.timeout = setTimeout(() => {
      showToast("Recording auto-stopped at 60s", "info");
      stopVoiceRecording();
    }, 60000);
  } catch (err) {
    console.error(err);
    resetVoiceState();
    showToast("Microphone permission blocked.", "error");
  }
}

function getCallPeerDisplayName(peer) {
  if (!peer) return "Friend";
  const friend = findFriend(peer);
  return friend ? getFriendDisplayName(friend) : peer;
}

function getCallStatusLabel() {
  if (callState.status === "outgoing") return "Calling...";
  if (callState.status === "ringing") return "Ringing...";
  if (callState.status === "incoming") return "Incoming call";
  if (callState.status === "connecting") return "Connecting...";
  if (callState.status === "reconnecting") return "Reconnecting...";
  if (callState.status === "active") return "In call";
  return "Call";
}

function getCallDurationSeconds() {
  if (!callState.startedAt) return 0;
  return Math.max(0, Math.floor((Date.now() - callState.startedAt) / 1000));
}

function updateCallTimer() {
  if (!callDurationText && !callMiniTime) return;
  if (!callState.startedAt) {
    if (callDurationText) callDurationText.classList.add("hidden");
    if (callMiniTime) callMiniTime.classList.add("hidden");
    return;
  }
  const formatted = formatCallDuration(getCallDurationSeconds());
  if (callDurationText) {
    callDurationText.textContent = formatted;
    callDurationText.classList.remove("hidden");
  }
  if (callMiniTime) {
    callMiniTime.textContent = formatted;
    callMiniTime.classList.remove("hidden");
  }
}

function startCallTimer() {
  if (callState.startedAt) return;
  callState.startedAt = Date.now();
  updateCallTimer();
  callState.timerId = setInterval(updateCallTimer, 1000);
}

function stopCallTimer() {
  if (callState.timerId) clearInterval(callState.timerId);
  callState.timerId = null;
  callState.startedAt = 0;
  if (callDurationText) {
    callDurationText.textContent = "00:00";
    callDurationText.classList.add("hidden");
  }
  if (callMiniTime) {
    callMiniTime.textContent = "00:00";
    callMiniTime.classList.add("hidden");
  }
}

function clearReconnectTimer() {
  if (callState.reconnectTimer) clearTimeout(callState.reconnectTimer);
  callState.reconnectTimer = null;
}

function scheduleReconnectTimeout() {
  if (callState.reconnectTimer) return;
  callState.reconnectTimer = setTimeout(() => {
    if (callState.status !== "reconnecting") return;
    showToast("Call lost.", "info");
    maybeSendCallLog("ended");
    resetCallState();
  }, 8000);
}

function maybeSendCallLog(status) {
  if (!callState.isCaller || !callState.peer || callState.logSent) return;
  const duration = status === "ended" ? getCallDurationSeconds() : 0;
  const payload = buildCallLogPayload(status, "outgoing", duration, callState.mediaType);
  const tempId = createClientTempId();
  const target = callState.peer;
  if (activeFriend && normalizeName(activeFriend) === normalizeName(target)) {
    queuePendingMessage({ to: target, text: payload, clientTempId: tempId }, { queue: false });
  }
  socket.emit("private_message", { to: target, text: payload, clientTempId: tempId });
  callState.logSent = true;
}

function applyVideoState() {
  if (callState.localStream) {
    callState.localStream.getVideoTracks().forEach((track) => {
      track.enabled = callState.videoEnabled;
    });
  }
  if (callLocalVideo) {
    const hasVideo = Boolean(callState.localStream && callState.localStream.getVideoTracks().length);
    callLocalVideo.classList.toggle("hidden", !callState.videoEnabled || !hasVideo);
  }
}

function setCallMinimized(value) {
  callState.minimized = Boolean(value);
  updateCallUi();
}

function updateCallUi() {
  if (!callModal) return;
  const show = callState.status !== "idle" && !callState.minimized;
  callModal.classList.toggle("hidden", !show);
  callModal.setAttribute("aria-hidden", show ? "false" : "true");
  callModal.classList.toggle("video", callState.mediaType === "video");
  if (callPeerName) callPeerName.textContent = getCallPeerDisplayName(callState.peer);
  if (callAvatar) {
    const displayName = getCallPeerDisplayName(callState.peer);
    const trimmed = String(displayName || "").trim();
    callAvatar.textContent = trimmed ? trimmed.slice(0, 2).toUpperCase() : "?";
  }
  if (callMiniAvatar) {
    const displayName = getCallPeerDisplayName(callState.peer);
    const trimmed = String(displayName || "").trim();
    callMiniAvatar.textContent = trimmed ? trimmed.slice(0, 2).toUpperCase() : "?";
  }
  if (callBadge) {
    callBadge.textContent = callState.mediaType === "video" ? "VIDEO CALL" : "VOICE CALL";
  }
  if (callMinimizeBtn) {
    callMinimizeBtn.style.display = callState.status === "incoming" ? "none" : "inline-flex";
    callMinimizeBtn.disabled = callState.status === "idle";
  }

  const statusLabel = getCallStatusLabel();
  if (callStatusText) callStatusText.textContent = statusLabel;
  if (callMiniName) callMiniName.textContent = getCallPeerDisplayName(callState.peer);
  if (callMiniStatus) callMiniStatus.textContent = statusLabel;
  if (callMini) {
    callMini.classList.toggle("hidden", callState.status === "idle" || !callState.minimized);
  }

  if (callAcceptBtn) callAcceptBtn.style.display = callState.status === "incoming" ? "inline-flex" : "none";
  if (callRejectBtn) callRejectBtn.style.display = callState.status === "incoming" ? "inline-flex" : "none";
  if (callHangupBtn) {
    const showHangup = ["outgoing", "ringing", "connecting", "reconnecting", "active"].includes(callState.status);
    callHangupBtn.style.display = showHangup ? "inline-flex" : "none";
    callHangupBtn.textContent = ["outgoing", "ringing"].includes(callState.status) ? "Cancel" : "End call";
  }

  const controlsEnabled = callState.status !== "idle";
  if (callMuteBtn) {
    callMuteBtn.disabled = !controlsEnabled;
    callMuteBtn.classList.toggle("muted", callState.muted);
    callMuteBtn.classList.toggle("active", callState.muted);
    callMuteBtn.setAttribute("aria-pressed", callState.muted ? "true" : "false");
    const label = callMuteBtn.querySelector("span");
    if (label) label.textContent = callState.muted ? "Unmute" : "Mute";
  }
  if (callSpeakerBtn) {
    callSpeakerBtn.disabled = !controlsEnabled;
    callSpeakerBtn.classList.toggle("active", callState.speakerOn);
    callSpeakerBtn.setAttribute("aria-pressed", callState.speakerOn ? "true" : "false");
    const label = callSpeakerBtn.querySelector("span");
    if (label) label.textContent = callState.speakerOn ? "Speaker" : "Speaker off";
  }
  if (callCameraBtn) {
    const showVideo = callState.mediaType === "video";
    const hasLocalVideo = Boolean(callState.localStream && callState.localStream.getVideoTracks().length);
    callCameraBtn.style.display = showVideo ? "inline-flex" : "none";
    callCameraBtn.disabled = !controlsEnabled || !showVideo || !hasLocalVideo;
    callCameraBtn.classList.toggle("active", callState.videoEnabled);
    callCameraBtn.setAttribute("aria-pressed", callState.videoEnabled ? "true" : "false");
    const label = callCameraBtn.querySelector("span");
    if (label) label.textContent = callState.videoEnabled ? "Camera" : "Camera off";
  }
  if (callFlipBtn) {
    const showVideo = callState.mediaType === "video";
    callFlipBtn.style.display = showVideo ? "inline-flex" : "none";
    const hasLocalVideo = Boolean(callState.localStream && callState.localStream.getVideoTracks().length);
    callFlipBtn.disabled = !controlsEnabled || !showVideo || !hasLocalVideo;
  }
  updateCallTimer();
}

function resetCallState() {
  clearReconnectTimer();
  stopCallTimer();
  if (callState.pc) {
    callState.pc.onicecandidate = null;
    callState.pc.ontrack = null;
    callState.pc.onconnectionstatechange = null;
    callState.pc.close();
  }
  if (callState.localStream) {
    callState.localStream.getTracks().forEach((t) => t.stop());
  }
  callState.status = "idle";
  callState.peer = "";
  callState.isCaller = false;
  callState.pc = null;
  callState.localStream = null;
  callState.remoteStream = null;
  callState.pendingOffer = null;
  callState.pendingCandidates = [];
  callState.muted = false;
  callState.speakerOn = true;
  callState.mediaType = "audio";
  callState.videoEnabled = true;
  callState.videoFacing = "user";
  callState.minimized = false;
  callState.logSent = false;
  callState.reconnectTimer = null;
  if (callRemoteAudio) {
    callRemoteAudio.srcObject = null;
    callRemoteAudio.muted = false;
    callRemoteAudio.volume = 1;
  }
  if (callRemoteVideo) {
    callRemoteVideo.srcObject = null;
    callRemoteVideo.classList.add("hidden");
  }
  if (callLocalVideo) {
    callLocalVideo.srcObject = null;
    callLocalVideo.classList.add("hidden");
  }
  updateCallUi();
}

function applyMuteState() {
  if (callState.localStream) {
    callState.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !callState.muted;
    });
  }
}

function applySpeakerState() {
  if (callRemoteAudio) {
    callRemoteAudio.muted = !callState.speakerOn;
    callRemoteAudio.volume = callState.speakerOn ? 1 : 0;
  }
  if (callRemoteVideo) {
    callRemoteVideo.muted = true;
  }
}

function toggleMute() {
  callState.muted = !callState.muted;
  applyMuteState();
  updateCallUi();
}

function toggleSpeaker() {
  callState.speakerOn = !callState.speakerOn;
  applySpeakerState();
  updateCallUi();
}

function toggleCamera() {
  if (callState.mediaType !== "video") return;
  if (!callState.localStream) return;
  callState.videoEnabled = !callState.videoEnabled;
  applyVideoState();
  updateCallUi();
}

async function switchCamera() {
  if (callState.mediaType !== "video") return;
  if (!navigator.mediaDevices?.getUserMedia) return;
  const nextFacing = callState.videoFacing === "user" ? "environment" : "user";
  try {
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: nextFacing },
    });
    const newTrack = newStream.getVideoTracks()[0];
    if (!newTrack) return;
    callState.videoFacing = nextFacing;
    newTrack.enabled = callState.videoEnabled;

    if (!callState.localStream) {
      callState.localStream = new MediaStream();
    }

    const oldTracks = callState.localStream.getVideoTracks();
    oldTracks.forEach((track) => {
      callState.localStream.removeTrack(track);
      track.stop();
    });
    callState.localStream.addTrack(newTrack);

    if (callState.pc) {
      const sender = callState.pc.getSenders().find((s) => s.track && s.track.kind === "video");
      if (sender) {
        await sender.replaceTrack(newTrack);
      } else {
        callState.pc.addTrack(newTrack, callState.localStream);
      }
    }

    if (callLocalVideo) {
      callLocalVideo.srcObject = callState.localStream;
      callLocalVideo.classList.toggle("hidden", !callState.videoEnabled);
      callLocalVideo.play().catch(() => {});
    }
  } catch (err) {
    console.error(err);
    showToast("Unable to switch camera.", "error");
  }
}

function createCallPeerConnection() {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  pc.onicecandidate = (event) => {
    if (!event.candidate || !callState.peer) return;
    socket.emit("call_signal", {
      to: callState.peer,
      type: "ice",
      candidate: event.candidate,
    });
  };

  pc.ontrack = (event) => {
    if (!callState.remoteStream) {
      callState.remoteStream = new MediaStream();
    }
    callState.remoteStream.addTrack(event.track);
    if (callRemoteAudio) {
      callRemoteAudio.srcObject = callState.remoteStream;
      callRemoteAudio.play().catch(() => {});
      applySpeakerState();
    }
    if (callRemoteVideo) {
      callRemoteVideo.srcObject = callState.remoteStream;
      if (callState.remoteStream.getVideoTracks().length) {
        callRemoteVideo.classList.remove("hidden");
        callRemoteVideo.play().catch(() => {});
      }
    }
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "connected") {
      callState.status = "active";
      clearReconnectTimer();
      startCallTimer();
      updateCallUi();
      return;
    }
    if (pc.connectionState === "disconnected") {
      callState.status = "reconnecting";
      updateCallUi();
      scheduleReconnectTimeout();
      return;
    }
    if (["failed", "closed"].includes(pc.connectionState)) {
      showToast("Call disconnected.", "info");
      maybeSendCallLog("ended");
      resetCallState();
    }
  };

  return pc;
}

function flushPendingCandidates() {
  if (!callState.pc || !callState.pc.remoteDescription) return;
  const pending = callState.pendingCandidates.splice(0, callState.pendingCandidates.length);
  pending.forEach((candidate) => {
    callState.pc.addIceCandidate(candidate).catch(() => {});
  });
}

async function applyRemoteOffer(offer) {
  if (!callState.pc || !offer) return;
  await callState.pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await callState.pc.createAnswer();
  await callState.pc.setLocalDescription(answer);
  socket.emit("call_signal", {
    to: callState.peer,
    type: "answer",
    sdp: callState.pc.localDescription,
  });
  flushPendingCandidates();
}

async function startCall(mediaType = "audio") {
  if (!socketAvailable) {
    showToast("Realtime connection not available.", "error");
    return;
  }
  if (!activeFriend) {
    showToast("Choose a friend first.", "error");
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast("Calling not supported in this browser.", "error");
    return;
  }
  if (!window.RTCPeerConnection) {
    showToast("Calling not supported in this browser.", "error");
    return;
  }
  if (callState.status !== "idle") {
    showToast("You're already in a call.", "error");
    return;
  }

  callState.peer = activeFriend;
  callState.isCaller = true;
  callState.status = "outgoing";
  callState.mediaType = mediaType === "video" ? "video" : "audio";
  callState.videoEnabled = callState.mediaType === "video";
  callState.videoFacing = "user";
  callState.minimized = false;
  callState.logSent = false;
  stopCallTimer();
  updateCallUi();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callState.mediaType === "video" ? { facingMode: callState.videoFacing } : false,
    });
    callState.localStream = stream;
    callState.pc = createCallPeerConnection();
    stream.getTracks().forEach((track) => callState.pc.addTrack(track, stream));
    applyMuteState();
    applyVideoState();
    if (callLocalVideo) {
      callLocalVideo.srcObject = stream;
      if (stream.getVideoTracks().length) {
        callLocalVideo.classList.remove("hidden");
        callLocalVideo.play().catch(() => {});
      }
    }

    const offer = await callState.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: callState.mediaType === "video",
    });
    await callState.pc.setLocalDescription(offer);

    socket.emit("call_invite", { to: callState.peer, type: callState.mediaType });
    socket.emit("call_signal", {
      to: callState.peer,
      type: "offer",
      sdp: callState.pc.localDescription,
    });
  } catch (err) {
    console.error(err);
    showToast("Camera or microphone permission blocked.", "error");
    if (callState.peer) socket.emit("call_cancel", { to: callState.peer });
    resetCallState();
  }
}

function startVoiceCall() {
  startCall("audio");
}

function startVideoCall() {
  startCall("video");
}

async function acceptIncomingCall() {
  if (callState.status !== "incoming") return;
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast("Calling not supported in this browser.", "error");
    return;
  }
  if (!window.RTCPeerConnection) {
    showToast("Calling not supported in this browser.", "error");
    return;
  }

  callState.status = "connecting";
  updateCallUi();
  socket.emit("call_answer", { to: callState.peer });

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callState.mediaType === "video" ? { facingMode: callState.videoFacing } : false,
    });
    callState.localStream = stream;
    callState.pc = createCallPeerConnection();
    stream.getTracks().forEach((track) => callState.pc.addTrack(track, stream));
    applyMuteState();
    applyVideoState();
    if (callLocalVideo) {
      callLocalVideo.srcObject = stream;
      if (stream.getVideoTracks().length) {
        callLocalVideo.classList.remove("hidden");
        callLocalVideo.play().catch(() => {});
      }
    }
    if (callState.pendingOffer) {
      const offer = callState.pendingOffer;
      callState.pendingOffer = null;
      await applyRemoteOffer(offer);
    }
  } catch (err) {
    console.error(err);
    showToast("Camera or microphone permission blocked.", "error");
    socket.emit("call_reject", { to: callState.peer });
    resetCallState();
  }
}

function rejectIncomingCall() {
  if (callState.status !== "incoming") return;
  if (callState.peer) socket.emit("call_reject", { to: callState.peer });
  resetCallState();
}

function hangupCall() {
  if (!callState.peer) {
    resetCallState();
    return;
  }
  const cancelling = ["outgoing", "ringing"].includes(callState.status);
  if (cancelling) {
    socket.emit("call_cancel", { to: callState.peer });
  } else {
    socket.emit("call_end", { to: callState.peer });
  }
  maybeSendCallLog(cancelling ? "cancelled" : "ended");
  resetCallState();
}

async function handleCallSignal(payload) {
  const from = String(payload?.from || "").trim();
  if (!from) return;

  if (!INCOMING_CALLS_ENABLED && callState.status === "idle") {
    socket.emit("call_reject", { to: from });
    return;
  }

  if (callState.status === "idle") {
    callState.peer = from;
    callState.isCaller = false;
    callState.status = "incoming";
    updateCallUi();
  }

  if (normalizeName(from) !== normalizeName(callState.peer)) return;

  if (payload?.type === "offer") {
    callState.pendingOffer = payload.sdp;
    if (callState.pc && callState.status !== "outgoing") {
      const offer = callState.pendingOffer;
      callState.pendingOffer = null;
      await applyRemoteOffer(offer);
    }
    return;
  }

  if (payload?.type === "answer") {
    if (!callState.pc) return;
    await callState.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    callState.status = "connecting";
    updateCallUi();
    flushPendingCandidates();
    return;
  }

  if (payload?.type === "ice" && payload.candidate) {
    if (callState.pc && callState.pc.remoteDescription) {
      callState.pc.addIceCandidate(payload.candidate).catch(() => {});
    } else {
      callState.pendingCandidates.push(payload.candidate);
    }
  }
}

function createClientTempId() {
  return `tmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function removePendingFromQueue(tempId) {
  if (!tempId) return;
  const idx = pendingQueue.findIndex((item) => item.tempId === tempId);
  if (idx >= 0) pendingQueue.splice(idx, 1);
}

function queuePendingMessage(payload, options = {}) {
  if (!payload || !payload.to || !payload.text) return;
  const shouldQueue = options.queue !== false;
  const shouldUpdateFriends = options.updateFriends !== false;
  const tempId = payload.clientTempId || createClientTempId();
  const timestamp = new Date().toISOString();
  const wasAtLatest = !hasNewerMessages();

  const message = {
    id: tempId,
    clientTempId: tempId,
    from: me || "You",
    to: payload.to,
    text: payload.text,
    timestamp,
    deliveredAt: null,
    seenAt: null,
    pending: true,
    replyTo: payload.replyTo || null,
    reactions: {},
  };

  conversationMessages.push(message);
  if (shouldUpdateFriends) {
    friends = friends.map((f) =>
      normalizeName(f.username) === normalizeName(payload.to)
        ? { ...f, lastMessage: payload.text, lastFrom: me, lastTimestamp: timestamp }
        : f
    );
    renderFriends();
  }
  pendingByTempId.set(tempId, message);
  if (shouldQueue) pendingQueue.push({ tempId, payload: { ...payload, clientTempId: tempId } });
  renderNetworkState();

  if (wasAtLatest && activeFriend && normalizeName(payload.to) === normalizeName(activeFriend)) {
    messageWindowEnd = conversationMessages.length;
    appendMessage(message);
    if (messagesEl && messagesEl.querySelectorAll("article.message").length > MAX_VISIBLE_MESSAGES) {
      setMessageWindowToLatest();
      renderMessageWindow();
    }
  }
  return tempId;
}

function updatePendingMessageText(tempId, text) {
  if (!tempId) return;
  const msg = pendingByTempId.get(tempId);
  if (!msg) return;
  msg.text = text;
  const row = messagesEl ? messagesEl.querySelector(`[data-client-temp-id="${tempId}"]`) : null;
  if (row) {
    const newRow = buildMessageElement(msg, true);
    row.replaceWith(newRow);
  }
  applyMessageSearch();
}

function removePendingMessage(tempId) {
  if (!tempId) return;
  pendingByTempId.delete(tempId);
  removePendingFromQueue(tempId);
  const idx = conversationMessages.findIndex((m) => m.clientTempId === tempId || m.id === tempId);
  if (idx >= 0) conversationMessages.splice(idx, 1);
  const row = messagesEl ? messagesEl.querySelector(`[data-client-temp-id="${tempId}"]`) : null;
  if (row) row.remove();
  messageWindowEnd = Math.min(messageWindowEnd, conversationMessages.length);
  applyMessageSearch();
}

function flushPendingQueue() {
  if (!socketAvailable || !socket.connected) {
    renderNetworkState();
    return;
  }
  if (!pendingQueue.length) {
    renderNetworkState();
    return;
  }
  const queue = pendingQueue.splice(0);
  queue.forEach((item) => {
    socket.emit("private_message", item.payload);
  });
  renderNetworkState();
}

function sendMessagePayload(payload, options = {}) {
  if (!payload || !payload.to || !payload.text) return;
  const tempId = payload.clientTempId || createClientTempId();
  if (!socketAvailable || !socket.connected) {
    queuePendingMessage({ ...payload, clientTempId: tempId }, { queue: true });
    showToast("Message queued. We'll send when you're back online.", "info");
    return tempId;
  }
  if (options.optimistic !== false) {
    queuePendingMessage({ ...payload, clientTempId: tempId }, { queue: false });
  }
  socket.emit("private_message", { ...payload, clientTempId: tempId });
  return tempId;
}

function sendActiveMessage() {
  const text = messageInput.value.trim();
  if (!activeFriend) { showToast("Choose a friend first.", "error"); return; }
  if (!text) return;

  if (hasNewerMessages()) {
    showLatestMessages();
  }
  stopLocalTyping();
  const payload = { to: activeFriend, text };
  if (replyTo) payload.replyTo = replyTo;
  sendMessagePayload(payload);
  messageInput.value = "";
  if (sendButton) sendButton.classList.remove("ready");
  clearReply();

  // Keep scroll pinned to bottom after sending
  scrollToBottom(true);
  scrollState.pinnedToBottom = true;
  keepComposerFocused();
}

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  sendActiveMessage();
});

if (voiceBtn) {
  voiceBtn.addEventListener("click", () => {
    if (voiceState.isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  });
}
if (voiceCancelBtn) {
  voiceCancelBtn.addEventListener("click", () => stopVoiceRecording(true));
}
if (voiceStopBtn) {
  voiceStopBtn.addEventListener("click", () => stopVoiceRecording(false));
}

if (callButton) {
  callButton.addEventListener("click", () => {
    startVoiceCall();
  });
}
if (videoButton) {
  videoButton.addEventListener("click", () => {
    startVideoCall();
  });
}
if (profileCallBtn) {
  profileCallBtn.addEventListener("click", () => {
    startVoiceCall();
  });
}
if (profileVideoBtn) {
  profileVideoBtn.addEventListener("click", () => {
    startVideoCall();
  });
}
if (callMuteBtn) callMuteBtn.addEventListener("click", toggleMute);
if (callSpeakerBtn) callSpeakerBtn.addEventListener("click", toggleSpeaker);
if (callCameraBtn) callCameraBtn.addEventListener("click", toggleCamera);
if (callFlipBtn) callFlipBtn.addEventListener("click", switchCamera);
if (callAcceptBtn) callAcceptBtn.addEventListener("click", acceptIncomingCall);
if (callRejectBtn) callRejectBtn.addEventListener("click", rejectIncomingCall);
if (callHangupBtn) callHangupBtn.addEventListener("click", hangupCall);
if (callMinimizeBtn) callMinimizeBtn.addEventListener("click", () => setCallMinimized(true));
if (callMiniEnd) {
  callMiniEnd.addEventListener("click", (event) => {
    event.stopPropagation();
    hangupCall();
  });
}
if (callMini) {
  callMini.addEventListener("click", (event) => {
    if (callMiniEnd && callMiniEnd.contains(event.target)) return;
    setCallMinimized(false);
  });
}

messageInput.addEventListener("input", () => {
  if (sendButton) {
    sendButton.classList.toggle("ready", messageInput.value.trim().length > 0);
  }
  if (!activeFriend) return;
  messageInput.value.trim() ? markLocalTyping() : stopLocalTyping();
});

if (messageSearchInput) {
  messageSearchInput.addEventListener("input", applyMessageSearch);
  messageSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      jumpSearchResult(e.shiftKey ? -1 : 1);
    }
  });
}
if (messageSearchPrev) {
  messageSearchPrev.addEventListener("click", () => jumpSearchResult(-1));
}
if (messageSearchNext) {
  messageSearchNext.addEventListener("click", () => jumpSearchResult(1));
}
if (messageSearchToggle) {
  messageSearchToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (searchPanelOpen) {
      closeMessageSearchPanel();
    } else {
      openMessageSearchPanel();
    }
  });
}
if (messageSearchPanel) {
  messageSearchPanel.addEventListener("click", (e) => e.stopPropagation());
}
if (messageSearchClear) {
  messageSearchClear.addEventListener("click", () => {
    if (messageSearchInput) messageSearchInput.value = "";
    applyMessageSearch();
    if (messageSearchInput) messageSearchInput.focus();
  });
}
if (contactsRequestsBtn) {
  contactsRequestsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const next = !contactsRequestsPanel?.classList.contains("is-open");
    setRequestsPanelOpen(next);
  });
}
document.addEventListener("click", () => {
  if (searchPanelOpen) closeMessageSearchPanel();
});
document.addEventListener("click", (e) => {
  if (!contactsRequestsPanel || !contactsRequestsBtn) return;
  if (!contactsRequestsPanel.classList.contains("is-open")) return;
  if (e.target.closest("#contactsRequestsPanel") || e.target.closest("#contactsRequestsBtn")) return;
  setRequestsPanelOpen(false);
});
document.addEventListener("keydown", (e) => {
  const isFindShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f";
  if (isFindShortcut) {
    e.preventDefault();
    openMessageSearchPanel();
    return;
  }

  if (e.key === "Escape" && contactsRequestsPanel?.classList.contains("is-open")) {
    setRequestsPanelOpen(false);
    return;
  }
  if (e.key === "Escape" && searchPanelOpen) {
    if (getSearchQuery()) {
      if (messageSearchInput) messageSearchInput.value = "";
      applyMessageSearch();
      return;
    }
    closeMessageSearchPanel();
  }
});

// Stop typing indicator when input loses focus
if (messageInput) {
  messageInput.addEventListener("blur", () => stopLocalTyping());

  // Allow Shift+Enter to send (optional quality-of-life)
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !messageInput.disabled) {
      e.preventDefault();
      sendActiveMessage();
    }
  });
}

// ─── Socket events ────────────────────────────────────────────────────────────

socket.on("register_success", (data) => {
  const previousActiveFriend = activeFriend;
  const storedSession = readStoredSession();
  me           = data.username;
  friends      = data.friends  || [];
  requests     = data.requests || [];
  activeFriend = "";
  setActiveChatTarget("");

  if (data.profile) {
    myProfile.avatarId    = data.profile.avatarId || "";
    myProfile.displayName = data.profile.displayName || "";
    myProfile.age         = data.profile.age || "";
    myProfile.gender      = data.profile.gender || "";
    myProfile.bio         = data.profile.bio || "";
  } else {
    myProfile.avatarId    = "";
    myProfile.displayName = "";
    myProfile.age         = "";
    myProfile.gender      = "";
    myProfile.bio         = "";
  }
  window._novynProfile  = myProfile;
  renderMyName();
  applyMyAvatar();
  syncSettingsPanel();
  clearSidebarSearch();
  if (storedSession?.password) {
    writeStoredSession({
      email: data.email || storedSession.email || "",
      username: data.username,
      password: storedSession.password,
    });
  }
  if (passwordInput) passwordInput.value = "";
  if (activeFriendLabel) activeFriendLabel.textContent = "Select a friend";
  renderActiveFriendPresence();
  syncRemoveFriendButton();

  if (loginCard) loginCard.classList.add("hidden");
  if (chatLayout) chatLayout.classList.remove("hidden");

  clearUsernameSuggestions();
  setLoginLoading(false);
  authenticateStoredSession._pending = false;
  setComposerEnabled(false);
  renderMessagesEmptyState(EMPTY_CONVERSATION_HINT);
  setNetworkState("Connected", "connected");

  renderRequests();
  renderFriends();
  renderDiscover();
  if (sidebarView === "discover") {
    requestDiscoverOnline();
  }
  if (
    previousActiveFriend &&
    friends.some((friend) => normalizeName(friend.username) === normalizeName(previousActiveFriend))
  ) {
    setActiveFriend(previousActiveFriend);
  }
  if (!hasGreeted) {
    hasGreeted = true;
    showToast(`Welcome to Novyn, @${me}! ✨`, "success");
  }
  ensurePushSubscription(false);
});

socket.on("username_unavailable", (data) => {
  const requested   = data?.requested   || "This username";
  const suggestions = data?.suggestions || [];
  showUsernameSuggestions(requested, suggestions);
  authenticateStoredSession._pending = false;
  setLoginLoading(false);
  showToast("Username already taken.", "error");
});

socket.on("auth_failed", (data) => {
  const message     = data?.message     || "Authentication failed.";
  const suggestions = data?.suggestions || [];
  authenticateStoredSession._pending = false;
  if (isDashboardPage) {
    clearStoredSession();
    showToast(message, "error");
    setTimeout(redirectToLogin, 450);
    return;
  }
  if (Array.isArray(suggestions) && suggestions.length) {
    showUsernameSuggestions(usernameInput ? usernameInput.value.trim() || "This username" : "This username", suggestions);
  }
  setLoginLoading(false);
  showToast(message, "error");
});

socket.on("friend_suggestions", (data) => {
  const query = String(data?.query || "").trim();
  const suggestions = data?.suggestions || [];
  if (!friendInput) return;
  const current = friendInput.value.trim();
  if (!query || normalizeSearchText(query) !== normalizeSearchText(current)) return;
  showFriendSuggestions(query, suggestions);
});

socket.on("discover_online", (data) => {
  setDiscoverUsers(data?.users || []);
});

socket.on("friend_request_received", (data) => {
  showToast(`💬 ${data.from} sent you a friend request`);
  if (!requests.includes(data.from)) {
    requests = [...requests, data.from];
    renderRequests();
    renderDiscover();
  }
  playIncomingPing();
});

socket.on("friend_request_sent", (data) => {
  showToast(`✓ Request sent to ${data.to}`, "success");
  const target = String(data?.to || "").trim();
  if (target) {
    discoverUsers = discoverUsers.filter((user) => normalizeName(user?.username) !== normalizeName(target));
    renderDiscover();
  }
});

socket.on("requests_updated", (data) => {
  requests = data.requests || [];
  renderRequests();
  renderDiscover();
});

socket.on("friend_request_accepted", (data) => {
  showToast(`🎉 ${data.by} is now your friend!`, "success");
});

socket.on("friend_list_updated", (data) => {
  friends = data.friends || [];
  friends.forEach((friend) => {
    const rawText = friend?.lastMessage || "";
    if (!rawText) return;
    if (!parseCallLogPayload(rawText)) return;
    addCallHistoryEntry({
      friend: friend.username || "",
      text: rawText,
      timestamp: friend.lastTimestamp || "",
      from: friend.lastFrom || friend.username || "",
    });
  });

  // If current chat partner was removed, reset
  if (activeFriend) {
    const stillThere = friends.some(
      (f) => normalizeName(f.username) === normalizeName(activeFriend)
    );
    if (!stillThere) {
      activeFriend                  = "";
      conversationMessages          = [];
      activeFriendLabel.textContent = "Select a friend";
      setComposerEnabled(false);
      renderMessagesEmptyState(EMPTY_CONVERSATION_HINT);
      resetMessageSearch();
      renderActiveFriendPresence();
      syncRemoveFriendButton();
    }
  }

  renderFriends();
  renderCallHistory();
  renderDiscover();
  if (sidebarView === "discover") {
    requestDiscoverOnline();
  }
});

socket.on("friend_removed", (data) => {
  const removedUsername = String(data?.username || "").trim();
  const removedKey = normalizeName(removedUsername);
  const activeKey = normalizeName(activeFriend);

  if (activeFriend && removedKey && activeKey === removedKey) {
    stopLocalTyping(activeFriend);
    activeFriend = "";
    setActiveChatTarget("");
    conversationMessages = [];
    clearReply();
    activeFriendLabel.textContent = "Select a friend";
    setComposerEnabled(false);
    hideTypingIndicator();
    renderMessagesEmptyState(EMPTY_CONVERSATION_HINT);
    resetMessageSearch();
    renderActiveFriendPresence();
    syncRemoveFriendButton();
  }

  const actor = String(data?.by || "").trim();
  if (actor && normalizeName(actor) !== normalizeName(me)) {
    showToast(`${actor} removed you from friends.`);
  } else if (removedUsername) {
    showToast(`${removedUsername} removed from friends.`);
  }
});

socket.on("friend_username_changed", (data) => {
  const oldUsername = String(data?.oldUsername || "").trim();
  const newUsername = String(data?.newUsername || "").trim();
  if (!oldUsername || !newUsername) return;
  const oldKey = normalizeName(oldUsername);
  const newKey = normalizeName(newUsername);

  if (activeFriend && normalizeName(activeFriend) === oldKey) {
    activeFriend = newUsername;
    setActiveChatTarget(activeFriend);
  }

  requests = requests.map((name) =>
    normalizeName(name) === oldKey ? newUsername : name
  );
  friends = friends.map((f) =>
    normalizeName(f.username) === oldKey ? { ...f, username: newUsername } : f
  );

  if (conversationMessages.length) {
    let touched = false;
    for (const msg of conversationMessages) {
      if (normalizeName(msg.from) === oldKey) { msg.from = newUsername; touched = true; }
      if (normalizeName(msg.to) === oldKey) { msg.to = newUsername; touched = true; }
      if (normalizeName(msg.fromKey) === oldKey) { msg.fromKey = newKey; touched = true; }
      if (normalizeName(msg.toKey) === oldKey) { msg.toKey = newKey; touched = true; }
      if (msg.replyTo && normalizeName(msg.replyTo.from) === oldKey) {
        msg.replyTo.from = newUsername;
        touched = true;
      }
    }
    if (touched) renderMessages(conversationMessages);
  }

  renderRequests();
  renderFriends();
  renderActiveFriendPresence();
  syncInfoPanel();
});

socket.on("username_changed", (data) => {
  const oldUsername = String(data?.oldUsername || "").trim();
  const newUsername = String(data?.newUsername || "").trim();
  if (!newUsername) return;
  const oldKey = normalizeName(oldUsername || me);
  const newKey = normalizeName(newUsername);
  if (normalizeName(me) === oldKey) {
    me = newUsername;
    renderMyName();
    applyMyAvatar();
    syncSettingsPanel();
    const stored = readStoredSession();
    if (stored?.password) {
      writeStoredSession({ username: newUsername, password: stored.password });
    }
  }
  if (conversationMessages.length) {
    let touched = false;
    for (const msg of conversationMessages) {
      if (normalizeName(msg.from) === oldKey) { msg.from = newUsername; touched = true; }
      if (normalizeName(msg.to) === oldKey) { msg.to = newUsername; touched = true; }
      if (normalizeName(msg.fromKey) === oldKey) { msg.fromKey = newKey; touched = true; }
      if (normalizeName(msg.toKey) === oldKey) { msg.toKey = newKey; touched = true; }
      if (msg.replyTo && normalizeName(msg.replyTo.from) === oldKey) {
        msg.replyTo.from = newUsername;
        touched = true;
      }
    }
    if (touched) renderMessages(conversationMessages);
  }
  showToast(`Username updated to @${newUsername}`, "success");
});

socket.on("password_changed", () => {
  showToast("Password updated.", "success");
});

socket.on("history", (data) => {
  if (normalizeName(data.with) !== normalizeName(activeFriend)) return;
  cacheCallLogMessages(data.messages || []);
  renderMessages(data.messages || []);
});

socket.on("private_message", (message) => {
  const tempId = message?.clientTempId || "";
  if (tempId && pendingByTempId.has(tempId) && normalizeName(message.from) === normalizeName(me)) {
    const pendingMessage = pendingByTempId.get(tempId);
    Object.assign(pendingMessage, message, { pending: false, clientTempId: tempId });
    pendingByTempId.delete(tempId);
    removePendingFromQueue(tempId);
    renderNetworkState();

    const row = messagesEl.querySelector(`[data-client-temp-id="${tempId}"]`);
    if (row) {
      row.dataset.messageId = message.id;
      row.dataset.timestamp = message.timestamp || "";
      row.dataset.tsFull = formatFullTimestamp(message.timestamp);
      if (row.dataset.tsFull) row.title = row.dataset.tsFull;
      row.classList.remove("pending");
      row.dataset.messageText = message.text || row.dataset.messageText;
      row.dataset.searchText = [
        row.dataset.messageFrom || "",
        row.dataset.messageText || "",
        message.replyTo?.text || "",
        message.replyTo?.from || "",
      ].join(" ");
      const body = row.querySelector(".message-body");
      if (body) {
        body.dataset.rawText = message.text || body.dataset.rawText || "";
      }
      const metaEl = row.querySelector(".message-meta");
      if (metaEl) {
        row.dataset.timeLabel = prettyTime(message.timestamp);
        renderMineMessageMeta(metaEl, row.dataset.timeLabel, getMessageStatusKey(pendingMessage));
      }
    }
    applyMessageSearch();
    return;
  }

  const cachedLog = cacheCallLogMessage(message);
  if (cachedLog) renderCallHistory();

  const other =
    normalizeName(message.from) === normalizeName(me) ? message.to : message.from;
  const isIncoming = normalizeName(message.from) !== normalizeName(me);
  const isActiveThread = activeFriend && normalizeName(other) === normalizeName(activeFriend);

  if (other) {
    friends = friends.map((f) =>
      normalizeName(f.username) === normalizeName(other)
        ? { ...f, lastMessage: message.text, lastFrom: message.from, lastTimestamp: message.timestamp || f.lastTimestamp }
        : f
    );
    renderFriends();
  }

  if (!isActiveThread) {
    // Message is for a different conversation — just show a toast
    if (isIncoming) {
      const sender = findFriend(message.from);
      const senderName = sender ? getFriendDisplayName(sender) : message.from;
      const callPreview = formatCallLogPreview(message.text, false);
      const preview = callPreview || String(message.text || "");
      showToast(`💬 ${senderName}: ${preview.slice(0, 40)}${preview.length > 40 ? "..." : ""}`);
      playIncomingPing();
      notifyIncomingMessage(message, { senderName, force: true });
    }
    return;
  }

  if (isIncoming) {
    hideTypingIndicator();
    playIncomingPing();
    notifyIncomingMessage(message);
  }

  const wasAtLatest = !hasNewerMessages();
  conversationMessages.push(message);
  if (wasAtLatest) {
    messageWindowEnd = conversationMessages.length;
    appendMessage(message);
    if (messagesEl && messagesEl.querySelectorAll("article.message").length > MAX_VISIBLE_MESSAGES) {
      setMessageWindowToLatest();
      renderMessageWindow();
    }
  }
  // Only bump the unread FAB counter for incoming messages, not our own
  if (normalizeName(message.from) !== normalizeName(me)) {
    if (window._novynFAB) window._novynFAB.bump();
  }
});

socket.on("message_status", (payload) => {
  if (!payload?.id || !payload?.with) return;
  if (!activeFriend || normalizeName(payload.with) !== normalizeName(activeFriend)) return;
  for (const message of conversationMessages) {
    if (message.id !== payload.id) continue;
    if (payload.deliveredAt) message.deliveredAt = payload.deliveredAt;
    if (payload.seenAt) message.seenAt = payload.seenAt;
    break;
  }
  const msgEl = messagesEl.querySelector(`[data-message-id="${payload.id}"]`);
  if (!msgEl || !msgEl.classList.contains("me")) return;
  const metaEl = msgEl.querySelector(".message-meta");
  if (!metaEl) return;
  const timeText = msgEl.dataset.timeLabel || prettyTime(msgEl.dataset.timestamp) || "";
  const statusKey = payload.seenAt ? "seen" : payload.deliveredAt ? "delivered" : "sent";
  renderMineMessageMeta(metaEl, timeText, statusKey);
});

socket.on("typing", ({ from, isTyping }) => {
  if (!activeFriend || normalizeName(from) !== normalizeName(activeFriend)) return;
  isTyping ? showTypingIndicator(from) : hideTypingIndicator();
});

socket.on("call_invite", (data) => {
  const from = String(data?.from || "").trim();
  if (!from) return;
  if (!INCOMING_CALLS_ENABLED) {
    socket.emit("call_reject", { to: from });
    showToast(`Missed call from ${getCallPeerDisplayName(from)}.`, "info");
    playIncomingPing();
    notifyIncomingCall(from, { blocked: true });
    return;
  }
  if (callState.status !== "idle") {
    socket.emit("call_reject", { to: from });
    return;
  }
  callState.peer = from;
  callState.isCaller = false;
  callState.status = "incoming";
  callState.mediaType = data?.type === "video" ? "video" : "audio";
  callState.videoEnabled = callState.mediaType === "video";
  callState.videoFacing = "user";
  callState.minimized = false;
  callState.logSent = false;
  stopCallTimer();
  updateCallUi();
  playIncomingPing();
  notifyIncomingCall(from);
});

socket.on("call_ringing", () => {
  if (callState.status === "outgoing") {
    callState.status = "ringing";
    updateCallUi();
  }
});

socket.on("call_answer", (data) => {
  if (normalizeName(data?.from) !== normalizeName(callState.peer)) return;
  if (callState.status === "outgoing") {
    callState.status = "connecting";
    updateCallUi();
  }
});

socket.on("call_reject", (data) => {
  if (normalizeName(data?.from) !== normalizeName(callState.peer)) return;
  showToast(`${getCallPeerDisplayName(callState.peer)} declined the call.`, "info");
  maybeSendCallLog("declined");
  resetCallState();
});

socket.on("call_cancelled", (data) => {
  if (normalizeName(data?.from) !== normalizeName(callState.peer)) return;
  showToast(`${getCallPeerDisplayName(callState.peer)} cancelled the call.`, "info");
  maybeSendCallLog("cancelled");
  resetCallState();
});

socket.on("call_end", (data) => {
  if (normalizeName(data?.from) !== normalizeName(callState.peer)) return;
  showToast("Call ended.", "info");
  maybeSendCallLog("ended");
  resetCallState();
});

socket.on("call_busy", () => {
  showToast("Friend is already on another call.", "error");
  maybeSendCallLog("busy");
  resetCallState();
});

socket.on("call_unavailable", () => {
  showToast("Friend is offline or unavailable.", "error");
  maybeSendCallLog("unavailable");
  resetCallState();
});

socket.on("call_signal", (payload) => {
  handleCallSignal(payload).catch(() => {});
});

socket.on("user_status", ({ username, online, lastSeenAt }) => {
  friends = friends.map((f) =>
    normalizeName(f.username) === normalizeName(username)
      ? { ...f, online, lastSeenAt: lastSeenAt || f.lastSeenAt || "" }
      : f
  );
  renderFriends();
  syncInfoPanel();
});

socket.on("error_message", (data) => {
  showToast(data.message || "Something went wrong", "error");
});

socket.on("connect", () => {
  setNetworkState("Connected", "connected");
  authenticateStoredSession(true);
  flushPendingQueue();
});

socket.on("disconnect", () => {
  stopLocalTyping();
  hideTypingIndicator();
  authenticateStoredSession._pending = false;
  setNetworkState("Disconnected", "offline");
  showToast("Disconnected from server", "error");
  if (callState.status !== "idle") resetCallState();
});

socket.on("connect_error", () => {
  authenticateStoredSession._pending = false;
  setNetworkState("Connection issue", "offline");
});

// ─── Profile helpers ──────────────────────────────────────────────────────────

function applyMyAvatar() {
  if (!meAvatar) return;
  const utils = window._novynAvatarUtils;
  if (utils && myProfile.avatarId) {
    utils.applyAvatarToEl(meAvatar, myProfile.avatarId, me.slice(0, 2).toUpperCase());
  } else {
    meAvatar.style.background = "";
    meAvatar.textContent = me.slice(0, 2).toUpperCase();
  }
}

socket.on("profile_updated", (data) => {
  myProfile.avatarId    = data.avatarId    || "";
  myProfile.displayName = data.displayName || "";
  myProfile.age         = data.age         || "";
  myProfile.gender      = data.gender      || "";
  myProfile.bio         = data.bio         || "";
  window._novynProfile  = myProfile;
  renderMyName();
  applyMyAvatar();
  syncSettingsPanel();
  syncInfoPanel();
  showToast("Profile updated ✨", "success");
});

socket.on("friend_profile_updated", (data) => {
  friends = friends.map((f) =>
    normalizeName(f.username) === normalizeName(data.username)
      ? { ...f, avatarId: data.avatarId, displayName: data.displayName, bio: data.bio || "" }
      : f
  );
  renderFriends();
  syncInfoPanel();
});

socket.on("reaction_updated", (payload) => {
  if (!payload?.messageId) return;
  if (window._novynReactions) {
    window._novynReactions.applyServerReactions(payload.messageId, payload.reactions);
  }
});

socket.on("message_deleted", (payload) => {
  if (!payload?.messageId || !payload?.with) return;
  if (!activeFriend || normalizeName(payload.with) !== normalizeName(activeFriend)) return;

  markConversationMessageDeleted(payload.messageId, payload.deletedAt, payload.text || DELETED_MESSAGE_TEXT);
  applyDeletedMessageToDom(payload.messageId, payload.text || DELETED_MESSAGE_TEXT);
  applyMessageSearch();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
setComposerEnabled(false);
renderActiveFriendPresence();
syncRemoveFriendButton();
syncMessageSearchUi();
if (messagesEl) {
  messagesEl.addEventListener("scroll", () => {
    scrollState.pinnedToBottom = isNearBottom();
  }, { passive: true });
}
window.addEventListener("resize", () => {
  if (!activeFriend) return;
  if (scrollState.pinnedToBottom) scrollToBottom(true);
}, { passive: true });

window._novynReply = { setReply };
window._novynSocket = socket;
window._novynMe = () => me;
window._novynActiveFriend = () => activeFriend;
window._novynToast = showToast;
window._novynMessageWindow = {
  hasNewer: hasNewerMessages,
  showLatest: showLatestMessages,
  loadOlder: loadOlderMessages,
};
window._novynOpenSettingsPanel = () => setSettingsOpen(true);
window._novynCloseSettingsPanel = () => setSettingsOpen(false);
window._novynUpdateSession = (nextIdentifier, nextPassword) => {
  const stored = readStoredSession() || {};
  const password = nextPassword || stored.password || "";
  const email = stored.email || "";
  const username = stored.username || me;
  if (!password) return;
  if (email) {
    writeStoredSession({ email, username, password });
    return;
  }
  if (username) {
    writeStoredSession({ username, password });
  }
};
renderMyName();
setSidebarView("messages", { silent: true });
syncSettingsPanel();
setTimeout(applyMyAvatar, 200);

if (!socketAvailable) {
  setNetworkState("Realtime unavailable", "offline");
  showToast("Realtime client failed to load. Open Novyn from your server URL.", "error");
}

