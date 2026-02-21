const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.static(path.join(__dirname, "public")));

const users = new Map();
const onlineUsers = new Map();
const conversations = new Map();

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

function toDisplayName(name) {
  return String(name || "").trim();
}

function getOrCreateUser(username) {
  const key = normalizeName(username);
  if (!users.has(key)) {
    users.set(key, {
      username: toDisplayName(username),
      friends: new Set(),
      requests: new Set(),
    });
  }
  return users.get(key);
}

function getConversationKey(userA, userB) {
  const a = normalizeName(userA);
  const b = normalizeName(userB);
  return [a, b].sort().join("::");
}

function buildFriendList(forUser) {
  const user = users.get(normalizeName(forUser));
  if (!user) return [];

  return Array.from(user.friends).map((friendKey) => {
    const friend = users.get(friendKey);
    return {
      username: friend?.username || friendKey,
      online: onlineUsers.has(friendKey),
    };
  });
}

function emitFriendList(username) {
  const userKey = normalizeName(username);
  const socketId = onlineUsers.get(userKey);
  if (!socketId) return;

  io.to(socketId).emit("friend_list_updated", {
    friends: buildFriendList(userKey),
  });
}

function emitRequests(username) {
  const userKey = normalizeName(username);
  const socketId = onlineUsers.get(userKey);
  if (!socketId) return;

  const user = users.get(userKey);
  if (!user) return;

  const requests = Array.from(user.requests).map((requesterKey) => {
    const requester = users.get(requesterKey);
    return requester?.username || requesterKey;
  });

  io.to(socketId).emit("requests_updated", { requests });
}

function emitStatusToFriends(username, isOnline) {
  const userKey = normalizeName(username);
  const user = users.get(userKey);
  if (!user) return;

  for (const friendKey of user.friends) {
    const friendSocket = onlineUsers.get(friendKey);
    if (!friendSocket) continue;

    io.to(friendSocket).emit("user_status", {
      username: user.username,
      online: isOnline,
    });
  }
}

io.on("connection", (socket) => {
  socket.on("register", (rawUsername) => {
    const username = toDisplayName(rawUsername);
    const userKey = normalizeName(username);

    if (!username) {
      socket.emit("error_message", { message: "Username is required." });
      return;
    }

    if (onlineUsers.has(userKey)) {
      socket.emit("error_message", {
        message: "This username is already online. Pick another one.",
      });
      return;
    }

    const user = getOrCreateUser(username);
    user.username = username;

    socket.data.userKey = userKey;
    onlineUsers.set(userKey, socket.id);

    socket.emit("register_success", {
      username: user.username,
      friends: buildFriendList(userKey),
      requests: Array.from(user.requests).map((requesterKey) => {
        const requester = users.get(requesterKey);
        return requester?.username || requesterKey;
      }),
    });

    emitStatusToFriends(userKey, true);
  });

  socket.on("add_friend", (rawFriendName) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;

    const friendName = toDisplayName(rawFriendName);
    const friendKey = normalizeName(friendName);

    if (!friendName) {
      socket.emit("error_message", { message: "Friend username is required." });
      return;
    }

    if (friendKey === userKey) {
      socket.emit("error_message", { message: "You cannot add yourself." });
      return;
    }

    const me = users.get(userKey);
    if (!me) {
      socket.emit("error_message", { message: "Please reconnect and try again." });
      return;
    }
    const friend = getOrCreateUser(friendName);

    if (me.friends.has(friendKey)) {
      socket.emit("error_message", { message: "Already friends." });
      return;
    }

    if (me.requests.has(friendKey)) {
      me.requests.delete(friendKey);
      me.friends.add(friendKey);
      friend.friends.add(userKey);

      emitFriendList(userKey);
      emitFriendList(friendKey);
      emitRequests(userKey);

      const friendSocket = onlineUsers.get(friendKey);
      if (friendSocket) {
        io.to(friendSocket).emit("friend_request_accepted", {
          by: me.username,
        });
      }

      socket.emit("friend_request_accepted", { by: friend.username });
      return;
    }

    if (friend.requests.has(userKey)) {
      socket.emit("error_message", { message: "Friend request already sent." });
      return;
    }

    friend.requests.add(userKey);
    socket.emit("friend_request_sent", { to: friend.username });

    const friendSocket = onlineUsers.get(friendKey);
    if (friendSocket) {
      io.to(friendSocket).emit("friend_request_received", {
        from: me.username,
      });
      emitRequests(friendKey);
    }
  });

  socket.on("accept_friend", (rawFriendName) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;

    const friendName = toDisplayName(rawFriendName);
    const friendKey = normalizeName(friendName);

    const me = users.get(userKey);
    const friend = users.get(friendKey);

    if (!me || !friend || !me.requests.has(friendKey)) {
      socket.emit("error_message", { message: "No pending request from this user." });
      return;
    }

    me.requests.delete(friendKey);
    me.friends.add(friendKey);
    friend.friends.add(userKey);

    emitRequests(userKey);
    emitFriendList(userKey);
    emitFriendList(friendKey);

    socket.emit("friend_request_accepted", { by: friend.username });

    const friendSocket = onlineUsers.get(friendKey);
    if (friendSocket) {
      io.to(friendSocket).emit("friend_request_accepted", { by: me.username });
    }
  });

  socket.on("get_history", (rawFriendName) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;

    const friendName = toDisplayName(rawFriendName);
    const friendKey = normalizeName(friendName);

    const me = users.get(userKey);
    if (!me || !me.friends.has(friendKey)) {
      socket.emit("error_message", { message: "You can only open chats with friends." });
      return;
    }

    const key = getConversationKey(userKey, friendKey);
    const messages = conversations.get(key) || [];

    socket.emit("history", {
      with: users.get(friendKey)?.username || friendName,
      messages,
    });
  });

  socket.on("private_message", (payload) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;

    const to = toDisplayName(payload?.to);
    const text = toDisplayName(payload?.text);
    const toKey = normalizeName(to);

    if (!text) return;

    const me = users.get(userKey);
    if (!me || !me.friends.has(toKey)) {
      socket.emit("error_message", { message: "You can message only your friends." });
      return;
    }

    const message = {
      from: me.username,
      to: users.get(toKey)?.username || to,
      text,
      timestamp: new Date().toISOString(),
    };

    const conversationKey = getConversationKey(userKey, toKey);
    const conversation = conversations.get(conversationKey) || [];
    conversation.push(message);

    if (conversation.length > 100) {
      conversation.shift();
    }

    conversations.set(conversationKey, conversation);

    socket.emit("private_message", message);

    const friendSocket = onlineUsers.get(toKey);
    if (friendSocket) {
      io.to(friendSocket).emit("private_message", message);
    }
  });

  socket.on("disconnect", () => {
    const userKey = socket.data.userKey;
    if (!userKey) return;

    const existingSocketId = onlineUsers.get(userKey);
    if (existingSocketId === socket.id) {
      onlineUsers.delete(userKey);
      emitStatusToFriends(userKey, false);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat app running on http://localhost:${PORT}`);
});
