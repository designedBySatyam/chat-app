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

let me           = "";
let activeFriend = "";
let friends      = [];
let requests     = [];
let replyTo      = null;
let myProfile    = { avatarId: "", displayName: "", age: "", gender: "" };
window._novynProfile = myProfile;

const localTyping = {
  active:    false,
  target:    "",
  timeoutId: null,
};

// ─── Utilities ───────────────────────────────────────────────────────────────

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

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
  toast.classList.remove("hidden", "error");
  if (type === "error") toast.classList.add("error");

  clearTimeout(showToast._timer);
  // Auto-hide after 2.8 s
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
  if (displayDiffersFromUsername(friend)) {
    return `${statusText} · @${friend.username}`;
  }
  return statusText;
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function showTypingIndicator(username) {
  if (!typingIndicator || !typingText) return;
  typingText.textContent = `${username} is typing`;
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

function renderMessagesEmptyState(text) {
  clearMessages();
  hideTypingIndicator();

  const empty       = document.createElement("div");
  empty.className   = "messages-empty";
  empty.textContent = text;
  messagesEl.appendChild(empty);
}

function getMessageStatusText(message) {
  if (message?.seenAt)      return "Seen";
  if (message?.deliveredAt) return "Delivered";
  return "Sent";
}

function buildMessageMeta(message, mine) {
  const time = prettyTime(message.timestamp);
  if (!mine) {
    const friend = findFriend(message.from);
    const senderName = friend ? getFriendDisplayName(friend) : message.from;
    return `${senderName} · ${time}`;
  }
  return `${time} · ${getMessageStatusText(message)}`;
}

function buildMessageElement(message, skipAnimation = false) {
  const mine = normalizeName(message.from) === normalizeName(me);

  const row       = document.createElement("article");
  row.className   = `message ${mine ? "me" : "them"}${skipAnimation ? " no-anim" : ""}`;
  if (message.id) row.dataset.messageId = message.id;
  row.dataset.messageFrom = message.from;
  row.dataset.messageText = message.text;
  if (message.reactions && Object.keys(message.reactions).length) {
    try {
      row.dataset.messageReactions = JSON.stringify(message.reactions);
    } catch (_) {
      // Ignore serialization errors for malformed payloads.
    }
  }

  const meta        = document.createElement("span");
  meta.className    = "message-meta";
  meta.textContent  = buildMessageMeta(message, mine);

  row.append(meta);

  if (message.replyTo) {
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
  body.textContent  = message.text;

  row.append(body);
  return row;
}

function appendMessage(message, skipAnimation = false) {
  const emptyNode = messagesEl.querySelector(".messages-empty");
  if (emptyNode) emptyNode.remove();

  const row  = buildMessageElement(message, skipAnimation);
  const near = isNearBottom();

  messagesEl.appendChild(row);
  if (near) scrollToBottom(skipAnimation);
}

function updateStats() {
  if (requestCount) requestCount.textContent = String(requests.length);
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

  messageInput.placeholder = isEnabled
    ? "Type a message…"
    : "Select a friend to start chatting";
}

function renderMessages(messages) {
  clearMessages();

  if (!messages.length) {
    renderMessagesEmptyState("No messages yet. Say hello!");
    return;
  }

  // Render all historical messages instantly (no animation per bubble)
  for (const message of messages) {
    appendMessage(message, /* skipAnimation */ true);
  }

  // Jump straight to bottom for history load (no animation needed)
  scrollToBottom(true);
  if (window._novynFAB) window._novynFAB.reset();
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
  clearReply();
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

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearUsernameSuggestions();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (!username || !password) return;
  socket.emit("register", { username, password });
});

// Clear suggestions as soon as the user starts editing
usernameInput.addEventListener("input", clearUsernameSuggestions);
passwordInput.addEventListener("input", clearUsernameSuggestions);

addFriendForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const val = friendInput.value.trim();
  if (!val) return;
  socket.emit("add_friend", val);
  friendInput.value = "";
});

if (removeFriendBtn) {
  removeFriendBtn.addEventListener("click", () => {
    if (!activeFriend) return;
    const target = activeFriend;
    const approved = window.confirm(
      `Unfriend @${target}?\n\nThis also clears your chat history with this user.`
    );
    if (!approved) return;
    socket.emit("remove_friend", target);
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
  scrollToBottom();
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

// Stop typing indicator when input loses focus
messageInput.addEventListener("blur", () => stopLocalTyping());

// Allow Shift+Enter to send (optional quality-of-life)
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
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
  } else {
    myProfile.avatarId    = "";
    myProfile.displayName = "";
    myProfile.age         = "";
    myProfile.gender      = "";
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
  setComposerEnabled(false);
  renderMessagesEmptyState("Choose a friend to load your conversation.");
  setNetworkState("Connected", "connected");

  renderRequests();
  renderFriends();
  showToast(`Welcome to Novyn, @${me}! ✨`);
});

socket.on("username_unavailable", (data) => {
  const requested   = data?.requested   || "This username";
  const suggestions = data?.suggestions || [];
  showUsernameSuggestions(requested, suggestions);
  showToast("Username already taken.", "error");
});

socket.on("auth_failed", (data) => {
  const message     = data?.message     || "Authentication failed.";
  const suggestions = data?.suggestions || [];
  if (Array.isArray(suggestions) && suggestions.length) {
    showUsernameSuggestions(usernameInput.value.trim() || "This username", suggestions);
  }
  showToast(message, "error");
});

socket.on("friend_request_received", (data) => {
  showToast(`${data.from} sent you a friend request`);
});

socket.on("friend_request_sent", (data) => {
  showToast(`Request sent to ${data.to}`);
});

socket.on("requests_updated", (data) => {
  requests = data.requests || [];
  renderRequests();
});

socket.on("friend_request_accepted", (data) => {
  showToast(`${data.by} is now your friend 🎉`);
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
      activeFriendLabel.textContent = "Select a friend";
      setComposerEnabled(false);
      renderMessagesEmptyState("Choose a friend to load your conversation.");
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
    clearReply();
    activeFriendLabel.textContent = "Select a friend";
    setComposerEnabled(false);
    hideTypingIndicator();
    renderMessagesEmptyState("Choose a friend to load your conversation.");
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
    }
    return;
  }

  if (normalizeName(message.from) !== normalizeName(me)) {
    hideTypingIndicator();
  }

  appendMessage(message);
  // Only bump the unread FAB counter for incoming messages, not our own
  if (normalizeName(message.from) !== normalizeName(me)) {
    if (window._novynFAB) window._novynFAB.bump();
  }
});

socket.on("message_status", (payload) => {
  if (!payload?.id || !payload?.with) return;
  if (!activeFriend || normalizeName(payload.with) !== normalizeName(activeFriend)) return;
  const msgEl = messagesEl.querySelector(`[data-message-id="${payload.id}"]`);
  if (!msgEl || !msgEl.classList.contains("me")) return;
  const metaEl = msgEl.querySelector(".message-meta");
  if (!metaEl) return;
  const timeText = metaEl.textContent.split("·")[0]?.trim() || "";
  let statusText = "Sent";
  if (payload.seenAt) statusText = "Seen";
  else if (payload.deliveredAt) statusText = "Delivered";
  metaEl.textContent = `${timeText} · ${statusText}`;
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
  window._novynProfile  = myProfile;
  renderMyName();
  applyMyAvatar();
  showToast("Profile updated ✨");
});

socket.on("friend_profile_updated", (data) => {
  friends = friends.map((f) =>
    normalizeName(f.username) === normalizeName(data.username)
      ? { ...f, avatarId: data.avatarId, displayName: data.displayName }
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

// ─── Init ─────────────────────────────────────────────────────────────────────
setComposerEnabled(false);
renderActiveFriendPresence();
syncRemoveFriendButton();

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
