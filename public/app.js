const socket = io();

const loginCard = document.getElementById("loginCard");
const chatLayout = document.getElementById("chatLayout");
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("usernameInput");
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

function prettyTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function clearMessages() {
  messagesEl.innerHTML = "";
}

function renderMessagesEmptyState(text) {
  clearMessages();
  const empty = document.createElement("div");
  empty.className = "messages-empty";
  empty.textContent = text;
  messagesEl.appendChild(empty);
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

  for (const msg of messages) {
    const mine = msg.from.toLowerCase() === me.toLowerCase();
    const row = document.createElement("article");
    row.className = `message ${mine ? "me" : "them"}`;

    const meta = document.createElement("span");
    meta.className = "message-meta";
    meta.textContent = `${msg.from} • ${prettyTime(msg.timestamp)}`;

    const body = document.createElement("div");
    body.textContent = msg.text;

    row.append(meta, body);
    messagesEl.appendChild(row);
  }

  messagesEl.scrollTop = messagesEl.scrollHeight;
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

function setActiveFriend(username) {
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

    const name = document.createElement("span");
    name.textContent = friend.username;

    const status = document.createElement("span");
    status.className = `status ${friend.online ? "online" : ""}`;
    status.textContent = friend.online ? "Online" : "Offline";

    btn.append(name, status);
    li.appendChild(btn);
    friendList.appendChild(li);
  }
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  socket.emit("register", usernameInput.value);
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

  socket.emit("private_message", {
    to: activeFriend,
    text,
  });

  messageInput.value = "";
});

socket.on("register_success", (data) => {
  me = data.username;
  friends = data.friends || [];
  requests = data.requests || [];
  activeFriend = "";

  meName.textContent = `@${me}`;
  activeFriendLabel.textContent = "Select a friend";
  loginCard.classList.add("hidden");
  chatLayout.classList.remove("hidden");
  setComposerEnabled(false);
  renderMessagesEmptyState("Choose a friend to load your conversation.");
  setNetworkState("Connected", "connected");
  renderRequests();
  renderFriends();
  showToast("Connected");
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
    const stillThere = friends.some((f) => normalizeName(f.username) === normalizeName(activeFriend));
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

  const mine = normalizeName(message.from) === normalizeName(me);
  const row = document.createElement("article");
  row.className = `message ${mine ? "me" : "them"}`;

  const meta = document.createElement("span");
  meta.className = "message-meta";
  meta.textContent = `${message.from} • ${prettyTime(message.timestamp)}`;

  const body = document.createElement("div");
  body.textContent = message.text;

  row.append(meta, body);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
});

socket.on("user_status", ({ username, online }) => {
  friends = friends.map((f) =>
    f.username.toLowerCase() === username.toLowerCase()
      ? {
          ...f,
          online,
        }
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
  setNetworkState("Disconnected", "offline");
  showToast("Disconnected from server", "error");
});

socket.on("connect_error", () => {
  setNetworkState("Connection issue", "offline");
});

setComposerEnabled(false);
