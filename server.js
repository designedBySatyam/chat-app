const fs = require("fs");
const fsp = require("fs/promises");
const crypto = require("crypto");
const path = require("path");
const http = require("http");
const express = require("express");
const { MongoClient } = require("mongodb");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.static(path.join(__dirname, "public")));

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "chat-state.json");
const MONGODB_URI = toDisplayName(process.env.MONGODB_URI);
const MONGODB_DB = toDisplayName(process.env.MONGODB_DB) || "novyn";
const MONGODB_COLLECTION = "chat_state";
const CHAT_RETENTION_DAYS = Math.max(
  1,
  Number.isFinite(Number(process.env.CHAT_RETENTION_DAYS))
    ? Math.floor(Number(process.env.CHAT_RETENTION_DAYS))
    : 30
);
const MIN_PASSWORD_LENGTH = 4;
const PASSWORD_ITERATIONS = 120000;
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_DIGEST = "sha512";

const users = new Map();
const onlineUsers = new Map();
const conversations = new Map();

let mongoClient = null;
let mongoCollection = null;

let persistTimer = null;
let persistInFlight = Promise.resolve();

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

function toDisplayName(name) {
  return String(name || "").trim();
}

function createPasswordSecret(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST)
    .toString("hex");

  return {
    passwordSalt: salt,
    passwordHash: hash,
  };
}

function verifyPassword(password, salt, hash) {
  if (!password || !salt || !hash) {
    return false;
  }

  const expected = crypto
    .pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST)
    .toString("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(hash, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function nowIso() {
  return new Date().toISOString();
}

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createUserRecord(username) {
  return {
    username: toDisplayName(username),
    friends: new Set(),
    requests: new Set(),
    unread: new Map(),
    isRegistered: false,
    passwordSalt: "",
    passwordHash: "",
    avatarId: "",
    age: "",
    gender: "",
    displayName: "",
  };
}

function serializeState() {
  return {
    users: Array.from(users.entries()).map(([key, user]) => ({
      key,
      username: user.username,
      friends: Array.from(user.friends),
      requests: Array.from(user.requests),
      unread: Array.from(user.unread.entries()),
      isRegistered: Boolean(user.isRegistered),
      passwordSalt: toDisplayName(user.passwordSalt),
      passwordHash: toDisplayName(user.passwordHash),
      avatarId: toDisplayName(user.avatarId),
      age: toDisplayName(user.age),
      gender: toDisplayName(user.gender),
      displayName: toDisplayName(user.displayName),
    })),
    conversations: Array.from(conversations.entries()).map(([key, messages]) => ({
      key,
      messages,
    })),
  };
}

async function persistFileNow() {
  const payload = JSON.stringify(serializeState(), null, 2);
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.writeFile(DATA_FILE, payload, "utf8");
}

async function persistMongoNow() {
  if (!mongoCollection) {
    return;
  }

  await mongoCollection.updateOne(
    { _id: "main" },
    {
      $set: {
        _id: "main",
        state: serializeState(),
        updatedAt: new Date(),
        retentionDays: CHAT_RETENTION_DAYS,
      },
    },
    { upsert: true }
  );
}

async function persistNow() {
  if (mongoCollection) {
    await persistMongoNow();
    return;
  }

  await persistFileNow();
}

function schedulePersist() {
  if (persistTimer) {
    clearTimeout(persistTimer);
  }

  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistInFlight = persistInFlight
      .then(() => persistNow())
      .catch((err) => {
        console.error("Failed to persist chat state:", err);
      });
  }, 180);
}

function hydrateMessage(rawMessage) {
  const message = rawMessage || {};
  const from = toDisplayName(message.from);
  const to = toDisplayName(message.to);
  const fromKey = normalizeName(message.fromKey || from);
  const toKey = normalizeName(message.toKey || to);

  return {
    id: toDisplayName(message.id) || createMessageId(),
    from: from || fromKey,
    to: to || toKey,
    fromKey,
    toKey,
    text: toDisplayName(message.text),
    timestamp: toDisplayName(message.timestamp) || nowIso(),
    deliveredAt: toDisplayName(message.deliveredAt) || null,
    seenAt: toDisplayName(message.seenAt) || null,
  };
}

function applyLoadedState(parsed) {
  users.clear();
  conversations.clear();

  for (const entry of parsed?.users || []) {
    const key = normalizeName(entry?.key || entry?.username);
    if (!key) continue;

    const user = createUserRecord(entry.username || key);
    user.friends = new Set((entry.friends || []).map(normalizeName).filter(Boolean));
    user.requests = new Set((entry.requests || []).map(normalizeName).filter(Boolean));
    user.isRegistered = Boolean(entry.isRegistered);
    user.passwordSalt = toDisplayName(entry.passwordSalt);
    user.passwordHash = toDisplayName(entry.passwordHash);
    user.avatarId = toDisplayName(entry.avatarId);
    user.age = toDisplayName(entry.age);
    user.gender = toDisplayName(entry.gender);
    user.displayName = toDisplayName(entry.displayName);

    for (const unreadEntry of entry.unread || []) {
      if (!Array.isArray(unreadEntry) || unreadEntry.length < 2) continue;
      const friendKey = normalizeName(unreadEntry[0]);
      if (!friendKey) continue;
      const count = Number(unreadEntry[1]);
      user.unread.set(friendKey, Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0);
    }

    users.set(key, user);
  }

  for (const entry of parsed?.conversations || []) {
    const key = toDisplayName(entry?.key);
    if (!key) continue;
    const messages = Array.isArray(entry.messages)
      ? entry.messages
          .map(hydrateMessage)
          .filter((message) => message.fromKey && message.toKey && message.text)
      : [];
    conversations.set(key, messages);
  }
}

async function loadStateFromFile() {
  if (!fs.existsSync(DATA_FILE)) {
    return false;
  }

  try {
    const raw = await fsp.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    applyLoadedState(parsed);
    return true;
  } catch (err) {
    console.error("Failed to load persisted chat state from file:", err);
    return false;
  }
}

async function initializeMongo() {
  if (!MONGODB_URI) {
    return;
  }

  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    mongoCollection = mongoClient.db(MONGODB_DB).collection(MONGODB_COLLECTION);
    console.log(`Connected to MongoDB database: ${MONGODB_DB}`);
  } catch (err) {
    mongoClient = null;
    mongoCollection = null;
    console.error("Failed to connect MongoDB, falling back to local file storage:", err);
  }
}

async function loadState() {
  await initializeMongo();
  let loaded = false;

  if (mongoCollection) {
    try {
      const doc = await mongoCollection.findOne({ _id: "main" });
      if (doc?.state) {
        applyLoadedState(doc.state);
        loaded = true;
      } else {
        const loadedFromFile = await loadStateFromFile();
        if (loadedFromFile) {
          loaded = true;
          await persistMongoNow();
          console.log("Migrated local file state into MongoDB.");
        }
      }
    } catch (err) {
      console.error("Failed to load chat state from MongoDB, trying local file:", err);
    }
  }

  if (!loaded) {
    loaded = await loadStateFromFile();
  }

  if (loaded) {
    const pruned = pruneExpiredMessages();
    if (pruned) {
      await persistNow();
      console.log(`Pruned expired messages older than ${CHAT_RETENTION_DAYS} day(s).`);
    }
  }
}

function getOrCreateUser(username) {
  const key = normalizeName(username);
  if (!users.has(key)) {
    users.set(key, createUserRecord(username));
    schedulePersist();
  }
  return users.get(key);
}

function isUsernameTaken(username) {
  const existing = users.get(normalizeName(username));
  return Boolean(existing?.isRegistered);
}

function buildUsernameSuggestions(requestedName, count = 5) {
  const raw = normalizeName(requestedName).replace(/[^a-z0-9_]/g, "") || "user";
  const maxBaseLength = 24;
  const suggestions = [];
  let suffix = 1;

  while (suggestions.length < count && suffix < 10000) {
    const suffixText = String(suffix);
    const availableLength = maxBaseLength - suffixText.length;
    const base = raw.slice(0, Math.max(1, availableLength));
    const candidate = `${base}${suffixText}`;

    if (!isUsernameTaken(candidate)) {
      suggestions.push(candidate);
    }

    suffix += 1;
  }

  return suggestions;
}

function getConversationKey(userA, userB) {
  const a = normalizeName(userA);
  const b = normalizeName(userB);
  return [a, b].sort().join("::");
}

function getRetentionCutoffMs() {
  return Date.now() - CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
}

function getMessageTimestampMs(message) {
  const value = Date.parse(toDisplayName(message?.timestamp));
  return Number.isNaN(value) ? Date.now() : value;
}

function recomputeUnreadFromConversations() {
  for (const user of users.values()) {
    user.unread = new Map(Array.from(user.friends).map((friendKey) => [friendKey, 0]));
  }

  for (const messages of conversations.values()) {
    for (const message of messages) {
      if (message.seenAt) continue;
      const recipient = users.get(message.toKey);
      if (!recipient || !recipient.friends.has(message.fromKey)) continue;
      const current = recipient.unread.get(message.fromKey) || 0;
      recipient.unread.set(message.fromKey, current + 1);
    }
  }
}

function pruneExpiredMessages() {
  const cutoffMs = getRetentionCutoffMs();
  let changed = false;

  for (const [key, messages] of conversations.entries()) {
    const filtered = messages.filter((message) => getMessageTimestampMs(message) >= cutoffMs);
    if (filtered.length !== messages.length) {
      changed = true;
    }

    if (!filtered.length) {
      if (messages.length) {
        changed = true;
      }
      conversations.delete(key);
      continue;
    }

    if (filtered.length !== messages.length) {
      conversations.set(key, filtered);
    }
  }

  if (changed) {
    recomputeUnreadFromConversations();
  }

  return changed;
}

function runRetentionMaintenance() {
  const pruned = pruneExpiredMessages();
  if (!pruned) {
    return;
  }

  schedulePersist();
  for (const userKey of onlineUsers.keys()) {
    emitFriendList(userKey);
  }
}

function startRetentionMaintenanceLoop() {
  const intervalMs = 60 * 60 * 1000;
  const timer = setInterval(runRetentionMaintenance, intervalMs);
  if (typeof timer.unref === "function") {
    timer.unref();
  }
}

function getUnreadCount(user, friendKey) {
  return user?.unread?.get(normalizeName(friendKey)) || 0;
}

function setUnreadCount(user, friendKey, value) {
  if (!user) return false;
  const key = normalizeName(friendKey);
  const safeValue = Math.max(0, Number.isFinite(Number(value)) ? Math.floor(Number(value)) : 0);
  const hasKey = user.unread.has(key);
  const previous = hasKey ? user.unread.get(key) : null;

  if (hasKey && previous === safeValue) {
    return false;
  }

  user.unread.set(key, safeValue);
  return true;
}

function incrementUnread(user, friendKey) {
  const current = getUnreadCount(user, friendKey);
  return setUnreadCount(user, friendKey, current + 1);
}

function initializeUnreadPair(userAKey, userBKey) {
  const userA = getOrCreateUser(userAKey);
  const userB = getOrCreateUser(userBKey);

  const changedA = setUnreadCount(userA, userBKey, getUnreadCount(userA, userBKey));
  const changedB = setUnreadCount(userB, userAKey, getUnreadCount(userB, userAKey));

  if (changedA || changedB) {
    schedulePersist();
  }
}

function getConversationSummary(userKey, friendKey) {
  const key = getConversationKey(userKey, friendKey);
  const messages = conversations.get(key) || [];

  if (!messages.length) {
    return {
      lastMessage: "",
      lastTimestamp: null,
      lastFrom: "",
    };
  }

  const message = messages[messages.length - 1];
  const text = toDisplayName(message.text);
  const compact = text.length > 52 ? `${text.slice(0, 49)}...` : text;

  return {
    lastMessage: compact,
    lastTimestamp: message.timestamp || null,
    lastFrom: message.from || "",
  };
}

function buildFriendList(forUser) {
  const userKey = normalizeName(forUser);
  const user = users.get(userKey);
  if (!user) return [];

  const list = Array.from(user.friends).map((friendKey) => {
    const friend = users.get(friendKey);
    const summary = getConversationSummary(userKey, friendKey);

    return {
      username: friend?.username || friendKey,
      online: onlineUsers.has(friendKey),
      unreadCount: getUnreadCount(user, friendKey),
      lastMessage: summary.lastMessage,
      lastTimestamp: summary.lastTimestamp,
      lastFrom: summary.lastFrom,
      avatarId: friend?.avatarId || "",
      displayName: friend?.displayName || "",
    };
  });

  list.sort((a, b) => {
    if (a.lastTimestamp && b.lastTimestamp) {
      return b.lastTimestamp.localeCompare(a.lastTimestamp);
    }
    if (a.lastTimestamp) return -1;
    if (b.lastTimestamp) return 1;
    return a.username.localeCompare(b.username);
  });

  return list;
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

function emitMessageStatus(message) {
  if (!message?.id) return;

  const senderSocket = onlineUsers.get(message.fromKey);
  const receiverSocket = onlineUsers.get(message.toKey);

  const senderPayload = {
    id: message.id,
    with: message.to,
    deliveredAt: message.deliveredAt || null,
    seenAt: message.seenAt || null,
  };

  const receiverPayload = {
    id: message.id,
    with: message.from,
    deliveredAt: message.deliveredAt || null,
    seenAt: message.seenAt || null,
  };

  if (senderSocket) {
    io.to(senderSocket).emit("message_status", senderPayload);
  }

  if (receiverSocket) {
    io.to(receiverSocket).emit("message_status", receiverPayload);
  }
}

function markUndeliveredAsDelivered(userKey) {
  let changed = false;

  for (const conversation of conversations.values()) {
    for (const message of conversation) {
      if (message.toKey === userKey && !message.deliveredAt) {
        message.deliveredAt = nowIso();
        changed = true;
        emitMessageStatus(message);
      }
    }
  }

  if (changed) {
    schedulePersist();
  }
}

function markConversationAsSeen(viewerKey, friendKey) {
  const key = getConversationKey(viewerKey, friendKey);
  const conversation = conversations.get(key) || [];
  const viewer = users.get(viewerKey);

  const unreadChanged = setUnreadCount(viewer, friendKey, 0);
  let statusChanged = false;

  for (const message of conversation) {
    if (message.toKey === viewerKey && message.fromKey === friendKey && !message.seenAt) {
      const seenAt = nowIso();
      if (!message.deliveredAt) {
        message.deliveredAt = seenAt;
      }
      message.seenAt = seenAt;
      statusChanged = true;
      emitMessageStatus(message);
    }
  }

  if (unreadChanged || statusChanged) {
    schedulePersist();
  }

  if (unreadChanged) {
    emitFriendList(viewerKey);
  }
}

io.on("connection", (socket) => {
  socket.on("register", (payload) => {
    const username =
      typeof payload === "string" ? toDisplayName(payload) : toDisplayName(payload?.username);
    const password = toDisplayName(typeof payload === "string" ? "" : payload?.password);
    const userKey = normalizeName(username);

    if (!username) {
      socket.emit("error_message", { message: "Username is required." });
      return;
    }

    const existing = users.get(userKey);
    const usernameExists = Boolean(existing?.isRegistered);
    const suggestions = buildUsernameSuggestions(username);

    let user = existing;

    if (usernameExists) {
      if (!password) {
        socket.emit("auth_failed", {
          message: "This username already exists. Enter the password to sign in.",
          suggestions,
        });
        return;
      }

      if (!existing.passwordSalt || !existing.passwordHash) {
        const secret = createPasswordSecret(password);
        existing.passwordSalt = secret.passwordSalt;
        existing.passwordHash = secret.passwordHash;
      } else if (!verifyPassword(password, existing.passwordSalt, existing.passwordHash)) {
        socket.emit("auth_failed", {
          message: "Incorrect password for this username.",
          suggestions,
        });
        return;
      }
    } else {
      if (password.length < MIN_PASSWORD_LENGTH) {
        socket.emit("auth_failed", {
          message: `Use at least ${MIN_PASSWORD_LENGTH} characters in password.`,
        });
        return;
      }

      user = getOrCreateUser(username);
      const secret = createPasswordSecret(password);
      user.passwordSalt = secret.passwordSalt;
      user.passwordHash = secret.passwordHash;
      user.isRegistered = true;
    }

    user.username = username;

    socket.data.userKey = userKey;
    socket.data.activeChatWith = null;

    const previousSocketId = onlineUsers.get(userKey);
    onlineUsers.set(userKey, socket.id);

    if (previousSocketId && previousSocketId !== socket.id) {
      const previousSocket = io.sockets.sockets.get(previousSocketId);
      if (previousSocket) {
        previousSocket.emit("error_message", {
          message: "You were signed out because this account logged in elsewhere.",
        });
        previousSocket.disconnect(true);
      }
    }

    markUndeliveredAsDelivered(userKey);

    socket.emit("register_success", {
      username: user.username,
      friends: buildFriendList(userKey),
      requests: Array.from(user.requests).map((requesterKey) => {
        const requester = users.get(requesterKey);
        return requester?.username || requesterKey;
      }),
      profile: {
        avatarId: user.avatarId || "",
        age: user.age || "",
        gender: user.gender || "",
        displayName: user.displayName || "",
      },
    });

    emitStatusToFriends(userKey, true);
    emitFriendList(userKey);
    schedulePersist();
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
      initializeUnreadPair(userKey, friendKey);

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
      schedulePersist();
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

    schedulePersist();
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
    initializeUnreadPair(userKey, friendKey);

    emitRequests(userKey);
    emitFriendList(userKey);
    emitFriendList(friendKey);

    socket.emit("friend_request_accepted", { by: friend.username });

    const friendSocket = onlineUsers.get(friendKey);
    if (friendSocket) {
      io.to(friendSocket).emit("friend_request_accepted", { by: me.username });
    }

    schedulePersist();
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

    runRetentionMaintenance();
    socket.data.activeChatWith = friendKey;
    markConversationAsSeen(userKey, friendKey);

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
    const friend = users.get(toKey);

    if (!me || !friend || !me.friends.has(toKey)) {
      socket.emit("error_message", { message: "You can message only your friends." });
      return;
    }

    const recipientSocketId = onlineUsers.get(toKey);
    const recipientSocket = recipientSocketId ? io.sockets.sockets.get(recipientSocketId) : null;

    const timestamp = nowIso();
    const recipientViewing = Boolean(recipientSocket && recipientSocket.data?.activeChatWith === userKey);

    const message = {
      id: createMessageId(),
      from: me.username,
      to: friend.username,
      fromKey: userKey,
      toKey,
      text,
      timestamp,
      deliveredAt: recipientSocketId ? timestamp : null,
      seenAt: recipientViewing ? timestamp : null,
    };

    const conversationKey = getConversationKey(userKey, toKey);
    const conversation = conversations.get(conversationKey) || [];
    conversation.push(message);

    conversations.set(conversationKey, conversation);
    runRetentionMaintenance();

    recipientViewing ? setUnreadCount(friend, userKey, 0) : incrementUnread(friend, userKey);

    socket.emit("private_message", message);

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("private_message", message);
    }

    emitMessageStatus(message);
    emitFriendList(userKey);
    emitFriendList(toKey);

    schedulePersist();
  });

  socket.on("typing", (payload) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;

    const toKey = normalizeName(payload?.to);
    const isTyping = Boolean(payload?.isTyping);

    const me = users.get(userKey);
    if (!me || !me.friends.has(toKey)) {
      return;
    }

    const friendSocket = onlineUsers.get(toKey);
    if (friendSocket) {
      io.to(friendSocket).emit("typing", {
        from: me.username,
        isTyping,
      });
    }
  });

  socket.on("disconnect", () => {
    const userKey = socket.data.userKey;
    if (!userKey) return;

    const existingSocketId = onlineUsers.get(userKey);
    if (existingSocketId === socket.id) {
      const user = users.get(userKey);
      if (user) {
        for (const friendKey of user.friends) {
          const friendSocket = onlineUsers.get(friendKey);
          if (friendSocket) {
            io.to(friendSocket).emit("typing", {
              from: user.username,
              isTyping: false,
            });
          }
        }
      }

      onlineUsers.delete(userKey);
      emitStatusToFriends(userKey, false);
    }
  });
});

async function closeStorage() {
  if (mongoClient) {
    try {
      await mongoClient.close();
    } catch (err) {
      console.error("Failed closing MongoDB connection:", err);
    } finally {
      mongoClient = null;
      mongoCollection = null;
    }
  }
}

async function shutdown() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }

  try {
    await persistInFlight.catch(() => {});
    await persistNow();
  } catch (err) {
    console.error("Failed to persist state during shutdown:", err);
  } finally {
    await closeStorage();
    process.exit(0);
  }
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

async function bootstrap() {
  await loadState();
  startRetentionMaintenanceLoop();

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(
      `Chat app running on http://localhost:${PORT} | retention=${CHAT_RETENTION_DAYS} day(s) | storage=${mongoCollection ? "mongodb" : "file"}`
    );
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});