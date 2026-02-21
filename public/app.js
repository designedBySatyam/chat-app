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

let me = "";
let activeFriend = "";
let friends = [];
let requests = [];

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
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

function renderMessages(messages) {
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
  clearMessages();
  socket.emit("get_history", username);
  renderFriends();
}

function renderFriends() {
  friendList.innerHTML = "";

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

  meName.textContent = `@${me}`;
  loginCard.classList.add("hidden");
  chatLayout.classList.remove("hidden");
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
      clearMessages();
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

socket.on("disconnect", () => {
  showToast("Disconnected from server", "error");
});
