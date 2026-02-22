const socketAvailable = typeof io === "function";
const socket = socketAvailable ? io() : { on() {}, emit() {} };

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
const requestList       = document.getElementById("requestList");
const friendList        = document.getElementById("friendList");
const activeFriendLabel = document.getElementById("activeFriendLabel");
const activeFriendPresenceLine = document.getElementById("activeFriendPresenceLine");
const activePresence    = document.getElementById("activePresence");
const activeFriendAvatar = document.getElementById("activeFriendAvatar");
const removeFriendBtn   = document.getElementById("removeFriendBtn");
const messagesEl        = document.getElementById("messages");
const meAvatar          = document.getElementById("meAvatar");
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
const sendButton        = messageForm.querySelector("button");
const messageSearchToggle = document.getElementById("messageSearchToggle");
const messageSearchPanel = document.getElementById("messageSearchPanel");
const messageSearchInput = document.getElementById("messageSearchInput");
const messageSearchClear = document.getElementById("messageSearchClear");
const messageSearchCount = document.getElementById("messageSearchCount");

let me           = "";
let activeFriend = "";
let friends      = [];
let requests     = [];
let replyTo      = null;
let searchPanelOpen = false;
let myProfile    = { avatarId: "", displayName: "", age: "", gender: "", bio: "" };
let conversationMessages = [];
window._novynProfile = myProfile;

const localTyping = {
  active:    false,
  target:    "",
  timeoutId: null,
};
const scrollState = {
  pinnedToBottom: true,
};
const EMPTY_CONVERSATION_HINT = "Choose a friend to load your conversation.";
const DELETED_MESSAGE_TEXT = "This message was deleted.";

// ─── Utilities ───────────────────────────────────────────────────────────────

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeSearchText(value) {
  return String(value || "").trim().toLowerCase();
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
  if (message?.seenAt) return "seen";
  if (message?.deliveredAt) return "delivered";
  return "sent";
}

const notificationAudio = {
  context: null,
  unlocked: false,
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

document.addEventListener("pointerdown", unlockNotificationAudio, { passive: true });
document.addEventListener("keydown", unlockNotificationAudio, { passive: true });

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

function setNetworkState(label, state) {
  if (!connectionLabel || !networkPill) return;
  connectionLabel.textContent = label;
  networkPill.classList.remove("connected", "offline");
  if (state === "connected") networkPill.classList.add("connected");
  if (state === "offline")   networkPill.classList.add("offline");
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(message, type = "info") {
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

// ─── Time formatting ──────────────────────────────────────────────────────────

function prettyTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

function applyMessageSearch() {
  const query = getSearchQuery();
  const messageNodes = Array.from(messagesEl.querySelectorAll("article.message"));
  let visibleCount = 0;

  for (const row of messageNodes) {
    const searchable = normalizeSearchText(
      row.dataset.searchText || `${row.dataset.messageText || ""} ${row.dataset.messageFrom || ""}`
    );
    const match = !query || searchable.includes(query);
    row.classList.toggle("search-hidden", !match);
    if (match) visibleCount += 1;
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

  syncMessageSearchUi();
}

// ─── Reply UI ─────────────────────────────────────────────────────────────────

const replyBanner = (() => {
  const banner     = document.createElement("div");
  banner.id        = "replyBanner";
  banner.className = "reply-banner hidden";
  const preview    = document.createElement("span");
  preview.className = "reply-preview-text";
  banner.appendChild(preview);
  const closeBtn   = document.createElement("button");
  closeBtn.type    = "button";
  closeBtn.className = "reply-cancel-btn";
  closeBtn.innerHTML = "✕";
  closeBtn.addEventListener("click", clearReply);
  banner.appendChild(closeBtn);
  messageForm.parentNode.insertBefore(banner, messageForm);
  return { banner, preview };
})();

function setReply(message) {
  replyTo = { id: message.id, from: message.from, text: message.text };
  replyBanner.preview.textContent = `Replying to ${message.from}: ${message.text.slice(0, 60)}${message.text.length > 60 ? "…" : ""}`;
  replyBanner.banner.classList.remove("hidden");
  messageInput.focus();
}

function clearReply() {
  replyTo = null;
  replyBanner.banner.classList.add("hidden");
  replyBanner.preview.textContent = "";
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
  hideTypingIndicator();

  const empty       = document.createElement("div");
  empty.className   = "messages-empty";
  empty.textContent = text;
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

  const tickA = document.createElement("span");
  tickA.className = "tick";
  tickA.textContent = "✓";

  const tickB = document.createElement("span");
  tickB.className = "tick";
  tickB.textContent = "✓";

  status.append(tickA, tickB);
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

function buildMessageElement(message, skipAnimation = false) {
  const mine = normalizeName(message.from) === normalizeName(me);
  const isDeleted = Boolean(message.deletedAt);
  const dateKey = getLocalDateKey(message.timestamp);
  const fullTimestamp = formatFullTimestamp(message.timestamp);

  const row       = document.createElement("article");
  row.className   = `message ${mine ? "me" : "them"}${skipAnimation ? " no-anim" : ""}`;
  if (message.id) row.dataset.messageId = message.id;
  row.dataset.dateKey = dateKey;
  row.dataset.timestamp = message.timestamp || "";
  row.dataset.tsFull = fullTimestamp;
  if (fullTimestamp) row.title = fullTimestamp;
  row.dataset.messageFrom = message.from;
  row.dataset.messageText = isDeleted ? DELETED_MESSAGE_TEXT : message.text;
  row.dataset.searchText = [
    row.dataset.messageFrom,
    row.dataset.messageText,
    message.replyTo?.text || "",
    message.replyTo?.from || "",
  ].join(" ");
  if (isDeleted) {
    row.classList.add("message-deleted");
  }

  if (message.reactions && Object.keys(message.reactions).length) {
    try {
      row.dataset.messageReactions = JSON.stringify(message.reactions);
    } catch (_) {
      // Ignore serialization errors for malformed payloads.
    }
  }

  const meta        = document.createElement("span");
  meta.className    = "message-meta";
  if (mine) {
    row.dataset.timeLabel = prettyTime(message.timestamp);
    renderMineMessageMeta(meta, row.dataset.timeLabel, getMessageStatusKey(message));
  } else {
    renderIncomingMessageMeta(meta, message);
  }

  row.append(meta);

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
      const orig = messagesEl.querySelector(`[data-message-id="${message.replyTo.id}"]`);
      if (orig) {
        orig.scrollIntoView({ behavior: "smooth", block: "center" });
        orig.classList.add("highlight-flash");
        setTimeout(() => orig.classList.remove("highlight-flash"), 1200);
      }
    });
    rq.append(ra, rt);
    row.append(rq);
  }

  const body        = document.createElement("div");
  body.className    = "message-body";
  body.textContent  = isDeleted ? DELETED_MESSAGE_TEXT : message.text;
  if (isDeleted) body.classList.add("message-body-deleted");

  row.append(body);
  return row;
}

function appendMessage(message, skipAnimation = false, withSeparator = true) {
  const emptyNode = messagesEl.querySelector(".messages-empty");
  if (emptyNode) emptyNode.remove();
  const preserveTop = messagesEl.scrollTop;
  const shouldAutoScroll = shouldAutoScrollForMessage(message, skipAnimation);

  if (withSeparator) {
    appendDateSeparator(message.timestamp);
  }

  const row = buildMessageElement(message, skipAnimation);

  messagesEl.appendChild(row);
  applyMessageSearch();
  if (shouldAutoScroll) {
    const mine = normalizeName(message.from) === normalizeName(me);
    scrollToBottom(skipAnimation || mine);
    scrollState.pinnedToBottom = true;
  } else {
    messagesEl.scrollTop = preserveTop;
  }
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

  if (!isEnabled) {
    stopLocalTyping();
    hideTypingIndicator();
  }

  messageInput.placeholder = "Type a message…";
}

function renderMessages(messages) {
  clearMessages();
  conversationMessages = Array.isArray(messages) ? messages.slice() : [];

  if (!conversationMessages.length) {
    renderMessagesEmptyState("No messages yet. Say hello!");
    applyMessageSearch();
    return;
  }

  // Render all historical messages instantly (no animation per bubble)
  for (const message of conversationMessages) {
    appendMessage(message, /* skipAnimation */ true, /* withSeparator */ true);
  }

  // Jump straight to bottom for history load (no animation needed)
  scrollToBottom(true);
  if (window._novynFAB) window._novynFAB.reset();
  applyMessageSearch();
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
  }

  const replyQuote = row.querySelector(".reply-quote");
  if (replyQuote) replyQuote.remove();

  const actions = row.querySelector(".msg-actions");
  if (actions) actions.remove();

  const reactions = row.querySelector(".message-reactions");
  if (reactions) reactions.innerHTML = "";
}

// ─── Requests ────────────────────────────────────────────────────────────────

function renderRequests() {
  requestList.innerHTML = "";
  updateStats();

  if (!requests.length) {
    const empty       = document.createElement("li");
    empty.className   = "item-card";
    empty.textContent = "No pending requests";
    requestList.appendChild(empty);
    return;
  }

  for (const username of requests) {
    const li      = document.createElement("li");
    li.className  = "item-card request-row";

    const name        = document.createElement("span");
    name.textContent  = username;

    const btn       = document.createElement("button");
    btn.type        = "button";
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
  if (normalizeName(friend.lastFrom) === normalizeName(me)) {
    return `You: ${friend.lastMessage}`;
  }
  if (friend.lastFrom) {
    return `${getFriendDisplayName(friend)}: ${friend.lastMessage}`;
  }
  return friend.lastMessage;
}

function findFriend(username) {
  return friends.find(
    (friend) => normalizeName(friend.username) === normalizeName(username)
  );
}

function renderActiveFriendPresence() {
  if (!activePresence || !activeFriendAvatar) return;

  if (!activeFriend) {
    activePresence.classList.add("hidden");
    activeFriendAvatar.classList.remove("online");
    activeFriendAvatar.textContent = "?";
    activeFriendAvatar.style.background = "";
    if (activeFriendPresenceLine) {
      activeFriendPresenceLine.textContent = "Select a friend to start chatting";
      activeFriendPresenceLine.classList.remove("online");
    }
    return;
  }

  const friend = findFriend(activeFriend);
  if (!friend) {
    activePresence.classList.add("hidden");
    if (activeFriendPresenceLine) {
      activeFriendPresenceLine.textContent = "Loading contact status...";
      activeFriendPresenceLine.classList.remove("online");
    }
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
    activeFriendPresenceLine.textContent = getFriendPresenceText(friend);
    activeFriendPresenceLine.classList.toggle("online", !!friend.online);
  }
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

function setActiveFriend(username) {
  if (activeFriend && normalizeName(activeFriend) !== normalizeName(username)) {
    stopLocalTyping(activeFriend);
  }

  activeFriend = username;
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
  setTimeout(() => messageInput.focus(), 50);
}

function renderFriends() {
  friendList.innerHTML = "";
  updateStats();

  if (!friends.length) {
    const empty       = document.createElement("li");
    empty.className   = "item-card";
    empty.textContent = "No friends yet — add one above";
    friendList.appendChild(empty);
    renderActiveFriendPresence();
    syncRemoveFriendButton();
    return;
  }

  for (const friend of friends) {
    const li      = document.createElement("li");
    li.className  = "item-card";

    const btn         = document.createElement("button");
    btn.type          = "button";
    btn.className     = `friend-btn${normalizeName(activeFriend) === normalizeName(friend.username) ? " active" : ""}`;
    btn.addEventListener("click", () => setActiveFriend(friend.username));

    // Avatar with initials + online dot
    const avatar        = document.createElement("div");
    avatar.className    = `friend-avatar${friend.online ? " online" : ""}`;
    if (friend.avatarId && window._novynAvatarUtils) {
      window._novynAvatarUtils.applyAvatarToEl(avatar, friend.avatarId, friend.username.slice(0, 2).toUpperCase());
    } else {
      avatar.textContent = friend.username.slice(0, 2).toUpperCase();
    }
    btn.appendChild(avatar);

    const main      = document.createElement("div");
    main.className  = "friend-main";

    const name        = document.createElement("span");
    name.className    = "friend-name";
    name.textContent  = getFriendDisplayName(friend);
    if (displayDiffersFromUsername(friend)) {
      name.title = `${getFriendDisplayName(friend)} (@${friend.username})`;
    } else {
      name.title = friend.username;
    }

    const preview       = document.createElement("span");
    preview.className   = "friend-preview";
    const previewBase = friendPreview(friend);
    preview.textContent = displayDiffersFromUsername(friend)
      ? `@${friend.username} · ${previewBase}`
      : previewBase;

    main.append(name, preview);

    const side      = document.createElement("div");
    side.className  = "friend-side";

    const status        = document.createElement("span");
    status.className    = `status${friend.online ? " online" : ""}`;
    status.textContent  = friend.online ? "Online" : formatLastSeen(friend.lastSeenAt);
    status.title = status.textContent;
    side.appendChild(status);

    const unreadCount = Number(friend.unreadCount) || 0;
    if (unreadCount > 0) {
      const unread        = document.createElement("span");
      unread.className    = "unread-badge";
      unread.textContent  = unreadCount > 99 ? "99+" : String(unreadCount);
      side.appendChild(unread);
    }

    btn.append(main, side);
    li.appendChild(btn);
    friendList.appendChild(li);
  }

  renderActiveFriendPresence();
  syncRemoveFriendButton();
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
  if (loginBtnText)    loginBtnText.textContent = isLoading ? "Entering…" : "Enter Novyn";
  if (loginBtnArrow)   loginBtnArrow.classList.toggle("hidden", isLoading);
  if (loginBtnSpinner) loginBtnSpinner.classList.toggle("hidden", !isLoading);
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearUsernameSuggestions();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (!username || !password) return;
  setLoginLoading(true);
  socket.emit("register", { username, password });
});

// Clear suggestions as soon as the user starts editing
usernameInput.addEventListener("input", clearUsernameSuggestions);
passwordInput.addEventListener("input", clearUsernameSuggestions);

addFriendForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const val = friendInput.value.trim();
  if (!val) return;
  if (me && normalizeName(val) === normalizeName(me)) {
    showToast("You can't add yourself!", "error");
    return;
  }
  socket.emit("add_friend", val);
  friendInput.value = "";
});

// ─── Custom unfriend confirm modal ────────────────────────────────────────────
const unfriendModal  = document.getElementById("unfriendModal");
const unfriendCancel  = document.getElementById("unfriendCancel");
const unfriendConfirm = document.getElementById("unfriendConfirm");
const unfriendModalTitle = document.getElementById("unfriendModalTitle");
const unfriendModalDesc  = document.getElementById("unfriendModalDesc");
let pendingUnfriendTarget = "";

function showUnfriendModal(target) {
  pendingUnfriendTarget = target;
  if (unfriendModalTitle) unfriendModalTitle.textContent = `Unfriend @${target}?`;
  if (unfriendModalDesc)  unfriendModalDesc.textContent  = `This will also clear your chat history with @${target}.`;
  if (unfriendModal) unfriendModal.style.display = "flex";
}
function hideUnfriendModal() {
  if (unfriendModal) unfriendModal.style.display = "none";
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

function sendActiveMessage() {
  const text = messageInput.value.trim();
  if (!activeFriend) { showToast("Choose a friend first.", "error"); return; }
  if (!text) return;

  stopLocalTyping();
  const payload = { to: activeFriend, text };
  if (replyTo) payload.replyTo = replyTo;
  socket.emit("private_message", payload);
  messageInput.value = "";
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

messageInput.addEventListener("input", () => {
  if (!activeFriend) return;
  messageInput.value.trim() ? markLocalTyping() : stopLocalTyping();
});

if (messageSearchInput) {
  messageSearchInput.addEventListener("input", applyMessageSearch);
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
document.addEventListener("click", () => {
  if (searchPanelOpen) closeMessageSearchPanel();
});
document.addEventListener("keydown", (e) => {
  const isFindShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f";
  if (isFindShortcut) {
    e.preventDefault();
    openMessageSearchPanel();
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
messageInput.addEventListener("blur", () => stopLocalTyping());

// Allow Shift+Enter to send (optional quality-of-life)
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !messageInput.disabled) {
    e.preventDefault();
    sendActiveMessage();
  }
});

// ─── Socket events ────────────────────────────────────────────────────────────

socket.on("register_success", (data) => {
  me           = data.username;
  friends      = data.friends  || [];
  requests     = data.requests || [];
  activeFriend = "";

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
  passwordInput.value           = "";
  activeFriendLabel.textContent = "Select a friend";
  renderActiveFriendPresence();
  syncRemoveFriendButton();

  loginCard.classList.add("hidden");
  chatLayout.classList.remove("hidden");

  clearUsernameSuggestions();
  setLoginLoading(false);
  setComposerEnabled(false);
  renderMessagesEmptyState(EMPTY_CONVERSATION_HINT);
  setNetworkState("Connected", "connected");

  renderRequests();
  renderFriends();
  showToast(`Welcome to Novyn, @${me}! ✨`, "success");
});

socket.on("username_unavailable", (data) => {
  const requested   = data?.requested   || "This username";
  const suggestions = data?.suggestions || [];
  showUsernameSuggestions(requested, suggestions);
  setLoginLoading(false);
  showToast("Username already taken.", "error");
});

socket.on("auth_failed", (data) => {
  const message     = data?.message     || "Authentication failed.";
  const suggestions = data?.suggestions || [];
  if (Array.isArray(suggestions) && suggestions.length) {
    showUsernameSuggestions(usernameInput.value.trim() || "This username", suggestions);
  }
  setLoginLoading(false);
  showToast(message, "error");
});

socket.on("friend_request_received", (data) => {
  showToast(`💬 ${data.from} sent you a friend request`);
  if (!requests.includes(data.from)) {
    requests = [...requests, data.from];
    renderRequests();
  }
  playIncomingPing();
});

socket.on("friend_request_sent", (data) => {
  showToast(`✓ Request sent to ${data.to}`, "success");
});

socket.on("requests_updated", (data) => {
  requests = data.requests || [];
  renderRequests();
});

socket.on("friend_request_accepted", (data) => {
  showToast(`🎉 ${data.by} is now your friend!`, "success");
});

socket.on("friend_list_updated", (data) => {
  friends = data.friends || [];

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
});

socket.on("friend_removed", (data) => {
  const removedUsername = String(data?.username || "").trim();
  const removedKey = normalizeName(removedUsername);
  const activeKey = normalizeName(activeFriend);

  if (activeFriend && removedKey && activeKey === removedKey) {
    stopLocalTyping(activeFriend);
    activeFriend = "";
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

socket.on("history", (data) => {
  if (normalizeName(data.with) !== normalizeName(activeFriend)) return;
  renderMessages(data.messages || []);
});

socket.on("private_message", (message) => {
  const other =
    normalizeName(message.from) === normalizeName(me) ? message.to : message.from;

  if (!activeFriend || normalizeName(other) !== normalizeName(activeFriend)) {
    // Message is for a different conversation — just show a toast
    if (normalizeName(message.from) !== normalizeName(me)) {
      const sender = findFriend(message.from);
      const senderName = sender ? getFriendDisplayName(sender) : message.from;
      showToast(`💬 ${senderName}: ${message.text.slice(0, 40)}${message.text.length > 40 ? "…" : ""}`);
      playIncomingPing();
    }
    return;
  }

  if (normalizeName(message.from) !== normalizeName(me)) {
    hideTypingIndicator();
    playIncomingPing();
  }

  conversationMessages.push(message);
  appendMessage(message);
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

socket.on("user_status", ({ username, online, lastSeenAt }) => {
  friends = friends.map((f) =>
    normalizeName(f.username) === normalizeName(username)
      ? { ...f, online, lastSeenAt: lastSeenAt || f.lastSeenAt || "" }
      : f
  );
  renderFriends();
});

socket.on("error_message", (data) => {
  showToast(data.message || "Something went wrong", "error");
});

socket.on("connect", () => {
  setNetworkState("Connected", "connected");
});

socket.on("disconnect", () => {
  stopLocalTyping();
  hideTypingIndicator();
  setNetworkState("Disconnected", "offline");
  showToast("Disconnected from server", "error");
});

socket.on("connect_error", () => {
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
  showToast("Profile updated ✨", "success");
});

socket.on("friend_profile_updated", (data) => {
  friends = friends.map((f) =>
    normalizeName(f.username) === normalizeName(data.username)
      ? { ...f, avatarId: data.avatarId, displayName: data.displayName, bio: data.bio || "" }
      : f
  );
  renderFriends();
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
renderMyName();
setTimeout(applyMyAvatar, 200);

if (!socketAvailable) {
  setNetworkState("Realtime unavailable", "offline");
  showToast("Realtime client failed to load. Open Novyn from your server URL.", "error");
}