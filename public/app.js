const socket = io();

const loginCard = document.getElementById("loginCard");
const chatLayout = document.getElementById("chatLayout");
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const usernameHint = document.getElementById("usernameHint");
const usernameSuggestions = document.getElementById("usernameSuggestions");
const meName = document.getElementById("meName");
const addFriendForm = document.getElementById("addFriendForm");
const friendInput = document.getElementById("friendInput");
const requestList = document.getElementById("requestList");
const friendList = document.getElementById("friendList");
const activeFriendLabel = document.getElementById("activeFriendLabel");
const messagesEl = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const toast = document.getElementById("toast");
const typingIndicator = document.getElementById("typingIndicator");
const typingText = document.getElementById("typingText");
const connectionLabel = document.getElementById("connectionLabel");
const networkPill = document.getElementById("networkPill");
const requestCount = document.getElementById("requestCount");
const friendCount = document.getElementById("friendCount");
const onlineCount = document.getElementById("onlineCount");
const sendButton = messageForm.querySelector("button");

let me = "";
let activeFriend = "";
let friends = [];
let requests = [];

const localTyping = {
  active: false,
  target: "",
  timeoutId: null,
};

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function setNetworkState(label, state) {
  if (!connectionLabel || !networkPill) return;
  connectionLabel.textContent = label;
  networkPill.classList.remove("connected", "offline");

  if (state === "connected") {
    networkPill.classList.add("connected");
  } else if (state === "offline") {
    networkPill.classList.add("offline");
  }
}

function showToast(message, type = "info") {
  toast.textContent = message;
  toast.classList.remove("hidden", "error");

  if (type === "error") {
    toast.classList.add("error");
  }

  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2600);
}

function clearUsernameSuggestions() {
  if (!usernameHint || !usernameSuggestions) return;
  usernameHint.textContent = "";
  usernameHint.classList.add("hidden");
  usernameSuggestions.innerHTML = "";
  usernameSuggestions.classList.add("hidden");
}

function showUsernameSuggestions(requested, suggestions) {
  if (!usernameHint || !usernameSuggestions) return;

  const suggestionList = Array.isArray(suggestions) ? suggestions.slice(0, 6) : [];
  usernameHint.textContent = `${requested} is already registered. Try one of these:`;
  usernameHint.classList.remove("hidden");
  usernameSuggestions.innerHTML = "";

  for (const suggestion of suggestionList) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "suggestion-chip";
    btn.textContent = suggestion;
    btn.addEventListener("click", () => {
      usernameInput.value = suggestion;
      usernameInput.focus();
    });
    usernameSuggestions.appendChild(btn);
  }

  if (suggestionList.length) {
    usernameSuggestions.classList.remove("hidden");
  } else {
    usernameSuggestions.classList.add("hidden");
  }
}

function prettyTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function showTypingIndicator(username) {
  if (!typingIndicator || !typingText) return;
  typingText.textContent = `${username} is typing`;
  typingIndicator.classList.remove("hidden");
}

function hideTypingIndicator() {
  if (!typingIndicator) return;
  typingIndicator.classList.add("hidden");
}

function emitTyping(isTyping, target = activeFriend) {
  if (!target) return;
  socket.emit("typing", {
    to: target,
    isTyping,
  });
}

function clearLocalTypingTimer() {
  if (localTyping.timeoutId) {
    clearTimeout(localTyping.timeoutId);
    localTyping.timeoutId = null;
  }
}

function stopLocalTyping(target = localTyping.target || activeFriend) {
  if (localTyping.active && target) {
    emitTyping(false, target);
  }

  localTyping.active = false;
  localTyping.target = "";
  clearLocalTypingTimer();
}

function scheduleLocalTypingStop() {
  clearLocalTypingTimer();
  localTyping.timeoutId = setTimeout(() => {
    stopLocalTyping();
  }, 1200);
}

function markLocalTyping() {
  if (!activeFriend) return;

  if (
    localTyping.active &&
    localTyping.target &&
    normalizeName(localTyping.target) !== normalizeName(activeFriend)
  ) {
    stopLocalTyping(localTyping.target);
  }

  if (!localTyping.active) {
    emitTyping(true, activeFriend);
  }

  localTyping.active = true;
  localTyping.target = activeFriend;
  scheduleLocalTypingStop();
}

function clearMessages() {
  messagesEl.innerHTML = "";
}

function renderMessagesEmptyState(text) {
  clearMessages();
  hideTypingIndicator();

  const empty = document.createElement("div");
  empty.className = "messages-empty";
  empty.textContent = text;
  messagesEl.appendChild(empty);
}

function getMessageStatusText(message) {
  if (message?.seenAt) return "Seen";
  if (message?.deliveredAt) return "Delivered";
  return "Sent";
}

function buildMessageMeta(message, mine) {
  const time = prettyTime(message.timestamp);
  if (!mine) {
    return `${message.from} • ${time}`;
  }

  return `${message.from} • ${time} • ${getMessageStatusText(message)}`;
}

function buildMessageElement(message) {
  const mine = normalizeName(message.from) === normalizeName(me);

  const row = document.createElement("article");
  row.className = `message ${mine ? "me" : "them"}`;

  if (message.id) {
    row.dataset.messageId = message.id;
  }

  const meta = document.createElement("span");
  meta.className = "message-meta";
  meta.textContent = buildMessageMeta(message, mine);

  const body = document.createElement("div");
  body.textContent = message.text;

  row.append(meta, body);
  return row;
}

function appendMessage(message) {
  const emptyNode = messagesEl.querySelector(".messages-empty");
  if (emptyNode) {
    emptyNode.remove();
  }

  const row = buildMessageElement(message);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function updateStats() {
  if (requestCount) {
    requestCount.textContent = String(requests.length);
  }

  if (friendCount) {
    friendCount.textContent = String(friends.length);
  }

  if (onlineCount) {
    const online = friends.filter((friend) => friend.online).length;
    onlineCount.textContent = `${online} online`;
  }
}

function setComposerEnabled(isEnabled) {
  messageInput.disabled = !isEnabled;
  if (sendButton) {
    sendButton.disabled = !isEnabled;
  }

  if (!isEnabled) {
    stopLocalTyping();
    hideTypingIndicator();
  }

  messageInput.placeholder = isEnabled
    ? "Type a message"
    : "Select a friend to start chatting";
}

function renderMessages(messages) {
  if (!messages.length) {
    renderMessagesEmptyState("No messages yet. Start the conversation.");
    return;
  }

  clearMessages();
  for (const message of messages) {
    appendMessage(message);
  }
}

function renderRequests() {
  requestList.innerHTML = "";
  updateStats();

  if (!requests.length) {
    const empty = document.createElement("li");
    empty.className = "item-card";
    empty.textContent = "No pending requests";
    requestList.appendChild(empty);
    return;
  }

  for (const username of requests) {
    const li = document.createElement("li");
    li.className = "item-card request-row";

    const name = document.createElement("span");
    name.textContent = username;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Accept";
    btn.addEventListener("click", () => {
      socket.emit("accept_friend", username);
    });

    li.append(name, btn);
    requestList.appendChild(li);
  }
}

function friendPreview(friend) {
  if (!friend.lastMessage) {
    return friend.online ? "Online now" : "No messages yet";
  }

  const prefix = normalizeName(friend.lastFrom) === normalizeName(me) ? "You: " : "";
  return `${prefix}${friend.lastMessage}`;
}

function setActiveFriend(username) {
  if (activeFriend && normalizeName(activeFriend) !== normalizeName(username)) {
    stopLocalTyping(activeFriend);
  }

  activeFriend = username;
  activeFriendLabel.textContent = `Chat with ${username}`;
  setComposerEnabled(true);
  renderMessagesEmptyState("Loading conversation...");
  socket.emit("get_history", username);
  renderFriends();
}

function renderFriends() {
  friendList.innerHTML = "";
  updateStats();

  if (!friends.length) {
    const empty = document.createElement("li");
    empty.className = "item-card";
    empty.textContent = "No friends yet";
    friendList.appendChild(empty);
    return;
  }

  for (const friend of friends) {
    const li = document.createElement("li");
    li.className = "item-card";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `friend-btn ${normalizeName(activeFriend) === normalizeName(friend.username) ? "active" : ""}`;
    btn.addEventListener("click", () => setActiveFriend(friend.username));

    const main = document.createElement("div");
    main.className = "friend-main";

    const name = document.createElement("span");
    name.className = "friend-name";
    name.textContent = friend.username;

    const preview = document.createElement("span");
    preview.className = "friend-preview";
    preview.textContent = friendPreview(friend);

    main.append(name, preview);

    const side = document.createElement("div");
    side.className = "friend-side";

    const status = document.createElement("span");
    status.className = `status ${friend.online ? "online" : ""}`;
    status.textContent = friend.online ? "Online" : "Offline";

    side.appendChild(status);

    const unreadCount = Number(friend.unreadCount) || 0;
    if (unreadCount > 0) {
      const unread = document.createElement("span");
      unread.className = "unread-badge";
      unread.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
      side.appendChild(unread);
    }

    btn.append(main, side);
    li.appendChild(btn);
    friendList.appendChild(li);
  }
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearUsernameSuggestions();
  socket.emit("register", {
    username: usernameInput.value,
    password: passwordInput.value,
  });
});

usernameInput.addEventListener("input", () => {
  clearUsernameSuggestions();
});

passwordInput.addEventListener("input", () => {
  clearUsernameSuggestions();
});

addFriendForm.addEventListener("submit", (e) => {
  e.preventDefault();
  socket.emit("add_friend", friendInput.value);
  friendInput.value = "";
});

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = messageInput.value.trim();
  if (!activeFriend) {
    showToast("Choose a friend first.", "error");
    return;
  }

  if (!text) return;

  stopLocalTyping();
  socket.emit("private_message", {
    to: activeFriend,
    text,
  });

  messageInput.value = "";
});

messageInput.addEventListener("input", () => {
  if (!activeFriend) return;

  if (!messageInput.value.trim()) {
    stopLocalTyping();
    return;
  }

  markLocalTyping();
});

messageInput.addEventListener("blur", () => {
  stopLocalTyping();
});

socket.on("register_success", (data) => {
  me = data.username;
  friends = data.friends || [];
  requests = data.requests || [];
  activeFriend = "";

  meName.textContent = `@${me}`;
  passwordInput.value = "";
  activeFriendLabel.textContent = "Select a friend";
  loginCard.classList.add("hidden");
  chatLayout.classList.remove("hidden");

  clearUsernameSuggestions();
  setComposerEnabled(false);
  renderMessagesEmptyState("Choose a friend to load your conversation.");
  setNetworkState("Connected", "connected");

  renderRequests();
  renderFriends();
  showToast("Connected");
});

socket.on("username_unavailable", (data) => {
  const requested = data?.requested || "This username";
  const suggestions = data?.suggestions || [];
  showUsernameSuggestions(requested, suggestions);
  showToast("Username already taken. Pick another one.", "error");
});

socket.on("auth_failed", (data) => {
  const message = data?.message || "Authentication failed.";
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
  showToast(`${data.by} is now your friend`);
});

socket.on("friend_list_updated", (data) => {
  friends = data.friends || [];

  if (activeFriend) {
    const stillThere = friends.some((friend) => normalizeName(friend.username) === normalizeName(activeFriend));
    if (!stillThere) {
      activeFriend = "";
      activeFriendLabel.textContent = "Select a friend";
      setComposerEnabled(false);
      renderMessagesEmptyState("Choose a friend to load your conversation.");
    }
  }

  renderFriends();
});

socket.on("history", (data) => {
  if (normalizeName(data.with) !== normalizeName(activeFriend)) {
    return;
  }

  renderMessages(data.messages || []);
});

socket.on("private_message", (message) => {
  const other = normalizeName(message.from) === normalizeName(me) ? message.to : message.from;
  if (!activeFriend || normalizeName(other) !== normalizeName(activeFriend)) {
    if (normalizeName(message.from) !== normalizeName(me)) {
      showToast(`New message from ${message.from}`);
    }
    return;
  }

  if (normalizeName(message.from) !== normalizeName(me)) {
    hideTypingIndicator();
  }

  appendMessage(message);
});

socket.on("message_status", (payload) => {
  if (!payload?.with) return;
  if (!activeFriend || normalizeName(payload.with) !== normalizeName(activeFriend)) {
    return;
  }

  socket.emit("get_history", activeFriend);
});

socket.on("typing", ({ from, isTyping }) => {
  if (!activeFriend || normalizeName(from) !== normalizeName(activeFriend)) {
    return;
  }

  if (isTyping) {
    showTypingIndicator(from);
  } else {
    hideTypingIndicator();
  }
});

socket.on("user_status", ({ username, online }) => {
  friends = friends.map((friend) =>
    normalizeName(friend.username) === normalizeName(username)
      ? {
          ...friend,
          online,
        }
      : friend
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

setComposerEnabled(false);
