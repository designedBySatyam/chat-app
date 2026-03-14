const fs = require("fs");
const fsp = require("fs/promises");
const crypto = require("crypto");
const path = require("path");
const http = require("http");
const express = require("express");
const multer = require("multer");
const { MongoClient } = require("mongodb");
const { Server } = require("socket.io");
const webpush = require("web-push");
const { cloudinary, hasCloudinaryConfig } = require("./cloudinary");

const app = express();
const server = http.createServer(app);

const uploadsDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({ dest: uploadsDir });
const uploadTokenSecret =
  process.env.UPLOAD_TOKEN_SECRET ||
  process.env.CLOUDINARY_API_SECRET ||
  "dev-secret";

if (!process.env.UPLOAD_TOKEN_SECRET && !process.env.CLOUDINARY_API_SECRET) {
  console.warn(
    "UPLOAD_TOKEN_SECRET is not set. Using an insecure dev secret for upload links."
  );
}

const VAPID_SUBJECT = toDisplayName(process.env.VAPID_SUBJECT) || "mailto:admin@novyn.local";
const VAPID_PUBLIC_KEY = toDisplayName(process.env.VAPID_PUBLIC_KEY);
const VAPID_PRIVATE_KEY = toDisplayName(process.env.VAPID_PRIVATE_KEY);
let vapidKeys = null;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  vapidKeys = { publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY };
} else {
  try {
    vapidKeys = webpush.generateVAPIDKeys();
    console.warn("VAPID keys are not set. Generated temporary keys for this session.");
    console.warn(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
    console.warn(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  } catch (err) {
    console.warn("Failed to generate VAPID keys. Push notifications disabled.", err);
    vapidKeys = null;
  }
}

const pushEnabled = Boolean(vapidKeys?.publicKey && vapidKeys?.privateKey);
if (pushEnabled) {
  webpush.setVapidDetails(VAPID_SUBJECT, vapidKeys.publicKey, vapidKeys.privateKey);
}

function signUploadToken(filename) {
  return crypto.createHmac("sha256", uploadTokenSecret).update(filename).digest("hex");
}

function withUploadToken(rawUrl) {
  const text = toDisplayName(rawUrl);
  if (!text || !text.startsWith("/uploads/")) return text;
  if (text.includes("token=")) return text;
  const [base, hash] = text.split("#");
  const pathOnly = base.split("?")[0];
  const filename = path.basename(pathOnly || "");
  if (!filename) return text;
  const token = signUploadToken(filename);
  const joiner = base.includes("?") ? "&" : "?";
  return `${base}${joiner}token=${token}${hash ? `#${hash}` : ""}`;
}

app.get("/uploads/:file", (req, res) => {
  const filename = path.basename(req.params.file || "");
  const token = String(req.query.token || "");
  if (!filename || token !== signUploadToken(filename)) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.sendFile(filePath);
});

app.post("/upload-voice", upload.single("voice"), async (req, res) => {
  if (!req.file?.path) {
    res.status(400).json({ error: "No voice file uploaded." });
    return;
  }

  try {
    if (hasCloudinaryConfig) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "auto",
        folder: "novyn_voice",
      });

      fs.unlink(req.file.path, () => {});
      res.json({ url: result.secure_url });
      return;
    }

    const mime = String(req.file.mimetype || "").toLowerCase();
    const extMap = {
      "audio/webm": ".webm",
      "audio/wav": ".wav",
      "audio/mpeg": ".mp3",
      "audio/ogg": ".ogg",
    };
    const ext = extMap[mime] || path.extname(req.file.originalname || "") || ".webm";
    const safeExt = ext.startsWith(".") ? ext : `.${ext}`;
    const filename = `voice-${Date.now()}-${crypto.randomBytes(3).toString("hex")}${safeExt}`;
    const destPath = path.join(uploadsDir, filename);
    fs.renameSync(req.file.path, destPath);
    const token = signUploadToken(filename);
    res.json({ url: `/uploads/${filename}?token=${token}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
});

const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(",") : "*",
  },
});

app.use(
  express.static(path.join(__dirname, "public"), {
    index: false,
    etag: false,
    lastModified: false,
    maxAge: 0,
    setHeaders: (res) => {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
    },
  })
);

app.get("/api/push/public-key", (req, res) => {
  if (!pushEnabled) {
    res.status(503).json({ error: "Push notifications are not configured." });
    return;
  }
  res.json({ publicKey: vapidKeys.publicKey });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});


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
const DELETED_MESSAGE_TEXT = "This message was deleted.";

const users = new Map();
const onlineUsers = new Map();
const conversations = new Map();
const activeCalls = new Map();

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
    pushSubs: [],
    isRegistered: false,
    passwordSalt: "",
    passwordHash: "",
    avatarId: "",
    age: "",
    gender: "",
    displayName: "",
    bio: "",
    lastSeenAt: "",
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
      pushSubs: Array.isArray(user.pushSubs) ? user.pushSubs : [],
      isRegistered: Boolean(user.isRegistered),
      passwordSalt: toDisplayName(user.passwordSalt),
      passwordHash: toDisplayName(user.passwordHash),
      avatarId: toDisplayName(user.avatarId),
      age: toDisplayName(user.age),
      gender: toDisplayName(user.gender),
      displayName: toDisplayName(user.displayName),
      bio: toDisplayName(user.bio),
      lastSeenAt: toDisplayName(user.lastSeenAt),
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

function normalizePushSubscription(raw) {
  const endpoint = toDisplayName(raw?.endpoint);
  const keys = raw?.keys || {};
  const p256dh = toDisplayName(keys.p256dh);
  const auth = toDisplayName(keys.auth);
  if (!endpoint || !p256dh || !auth) return null;
  return {
    endpoint,
    keys: { p256dh, auth },
    expirationTime:
      raw?.expirationTime === null || raw?.expirationTime === undefined
        ? null
        : raw.expirationTime,
  };
}

function upsertPushSubscription(user, raw) {
  if (!user) return false;
  const normalized = normalizePushSubscription(raw);
  if (!normalized) return false;
  if (!Array.isArray(user.pushSubs)) user.pushSubs = [];
  const existingIndex = user.pushSubs.findIndex((sub) => sub.endpoint === normalized.endpoint);
  if (existingIndex >= 0) {
    user.pushSubs[existingIndex] = normalized;
    return true;
  }
  user.pushSubs.push(normalized);
  return true;
}

function removePushSubscription(user, endpoint) {
  if (!user || !Array.isArray(user.pushSubs) || !endpoint) return false;
  const before = user.pushSubs.length;
  user.pushSubs = user.pushSubs.filter((sub) => sub.endpoint !== endpoint);
  return user.pushSubs.length !== before;
}

function detachSubscriptionFromAll(endpoint, exceptKey) {
  if (!endpoint) return false;
  let changed = false;
  for (const [key, user] of users.entries()) {
    if (exceptKey && key === exceptKey) continue;
    if (removePushSubscription(user, endpoint)) {
      changed = true;
    }
  }
  return changed;
}

function formatPushBody(text, fallback = "New message") {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return fallback;
  if (cleaned.length <= 120) return cleaned;
  return `${cleaned.slice(0, 117)}...`;
}

async function sendPushToUser(userKey, payload) {
  if (!pushEnabled || !userKey) return;
  const user = users.get(userKey);
  if (!user || !Array.isArray(user.pushSubs) || user.pushSubs.length === 0) return;

  const body = JSON.stringify(payload || {});
  const remaining = [];
  let changed = false;

  for (const sub of user.pushSubs) {
    try {
      await webpush.sendNotification(sub, body);
      remaining.push(sub);
    } catch (err) {
      const status = err?.statusCode;
      if (status === 404 || status === 410) {
        changed = true;
        continue;
      }
      console.warn("Push notification failed:", status || err?.message || err);
      remaining.push(sub);
    }
  }

  if (changed) {
    user.pushSubs = remaining;
    schedulePersist();
  }
}

function hydrateMessage(rawMessage) {
  const message = rawMessage || {};
  const from = toDisplayName(message.from);
  const to = toDisplayName(message.to);
  const fromKey = normalizeName(message.fromKey || from);
  const toKey = normalizeName(message.toKey || to);

  const hydrated = {
    id: toDisplayName(message.id) || createMessageId(),
    from: from || fromKey,
    to: to || toKey,
    fromKey,
    toKey,
    text: withUploadToken(message.text),
    timestamp: toDisplayName(message.timestamp) || nowIso(),
    deliveredAt: toDisplayName(message.deliveredAt) || null,
    seenAt: toDisplayName(message.seenAt) || null,
    deletedAt: toDisplayName(message.deletedAt) || null,
    reactions: message.reactions || {},
  };
  if (hydrated.deletedAt && !hydrated.text) {
    hydrated.text = DELETED_MESSAGE_TEXT;
  }
  if (message.replyTo && message.replyTo.id) {
    hydrated.replyTo = {
      id: toDisplayName(message.replyTo.id),
      from: toDisplayName(message.replyTo.from),
      text: toDisplayName(message.replyTo.text),
    };
  }
  return hydrated;
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
    user.bio = toDisplayName(entry.bio);
    user.lastSeenAt = toDisplayName(entry.lastSeenAt);
    user.pushSubs = Array.isArray(entry.pushSubs)
      ? entry.pushSubs.filter((sub) => sub && sub.endpoint && sub.keys)
      : [];

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

function buildFriendSearchSuggestions(query, me, limit = 6) {
  const needle = normalizeName(query).replace(/[^a-z0-9_]/g, "");
  if (!needle) return [];
  const meKey = me ? normalizeName(me.username) : "";
  const results = [];

  users.forEach((user) => {
    if (!user?.isRegistered) return;
    const name = user.username || "";
    const key = normalizeName(name);
    if (!key || key === meKey) return;
    if (!key.includes(needle)) return;
    results.push(name);
  });

  results.sort((a, b) => {
    const aKey = normalizeName(a);
    const bKey = normalizeName(b);
    const aStarts = aKey.startsWith(needle);
    const bStarts = bKey.startsWith(needle);
    if (aStarts !== bStarts) return aStarts ? -1 : 1;
    return a.localeCompare(b);
  });

  const filtered = [];
  for (const name of results) {
    const key = normalizeName(name);
    if (!key || !meKey) {
      filtered.push(name);
      continue;
    }
    const friend = users.get(key);
    if (me.friends.has(key)) continue;
    if (me.requests.has(key)) continue;
    if (friend?.requests?.has(meKey)) continue;
    filtered.push(name);
    if (filtered.length >= limit) break;
  }
  return filtered.slice(0, limit);
}

function getConversationKey(userA, userB) {
  const a = normalizeName(userA);
  const b = normalizeName(userB);
  return [a, b].sort().join("::");
}

function setCallPair(userKey, peerKey, status) {
  activeCalls.set(userKey, { peerKey, status });
  activeCalls.set(peerKey, { peerKey: userKey, status });
}

function clearCallPair(userKey) {
  const state = activeCalls.get(userKey);
  if (!state) return null;
  const peerKey = state.peerKey;
  activeCalls.delete(userKey);
  if (peerKey) activeCalls.delete(peerKey);
  return peerKey;
}

function applyUsernameChange(userKey, newUsername) {
  const oldKey = normalizeName(userKey);
  const user = users.get(oldKey);
  if (!user) {
    return { ok: false, message: "User not found." };
  }

  const desired = toDisplayName(newUsername);
  if (!desired) {
    return { ok: false, message: "Username is required." };
  }

  const newKey = normalizeName(desired);
  if (!newKey) {
    return { ok: false, message: "Invalid username." };
  }

  const oldUsername = user.username || oldKey;
  const sameKey = newKey === oldKey;
  if (sameKey && desired === oldUsername) {
    return { ok: false, message: "That's already your username." };
  }

  if (!sameKey) {
    const existing = users.get(newKey);
    if (existing) {
      return { ok: false, message: "That username is already taken." };
    }
  }

  if (activeCalls.has(oldKey)) {
    return { ok: false, message: "End your call before changing username." };
  }

  if (!sameKey) {
    users.delete(oldKey);
    users.set(newKey, user);
  }

  user.username = desired;
  user.isRegistered = true;

  if (!sameKey && onlineUsers.has(oldKey)) {
    const socketId = onlineUsers.get(oldKey);
    onlineUsers.delete(oldKey);
    onlineUsers.set(newKey, socketId);
  }

  if (!sameKey) {
    users.forEach((other) => {
      if (!other || other === user) return;
      if (other.friends.has(oldKey)) {
        other.friends.delete(oldKey);
        other.friends.add(newKey);
      }
      if (other.requests.has(oldKey)) {
        other.requests.delete(oldKey);
        other.requests.add(newKey);
      }
      if (other.unread.has(oldKey)) {
        const count = other.unread.get(oldKey);
        other.unread.delete(oldKey);
        other.unread.set(newKey, count);
      }
    });
  }

  const nextConversations = new Map();
  conversations.forEach((messages, key) => {
    const [a, b] = key.split("::");
    const containsOld = a === oldKey || b === oldKey;
    const newA = a === oldKey ? newKey : a;
    const newB = b === oldKey ? newKey : b;
    const nextKey = containsOld ? getConversationKey(newA, newB) : key;

    if (containsOld) {
      for (const msg of messages) {
        if (normalizeName(msg.fromKey) === oldKey) {
          msg.fromKey = newKey;
          msg.from = desired;
        }
        if (normalizeName(msg.toKey) === oldKey) {
          msg.toKey = newKey;
          msg.to = desired;
        }
        if (msg.replyTo && normalizeName(msg.replyTo.from) === oldKey) {
          msg.replyTo.from = desired;
        }
      }
    }

    if (nextConversations.has(nextKey)) {
      nextConversations.set(nextKey, nextConversations.get(nextKey).concat(messages));
    } else {
      nextConversations.set(nextKey, messages);
    }
  });
  conversations.clear();
  nextConversations.forEach((value, key) => conversations.set(key, value));

  return {
    ok: true,
    oldKey,
    newKey,
    oldUsername,
    newUsername: desired,
  };
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
  const text = message.deletedAt ? DELETED_MESSAGE_TEXT : toDisplayName(message.text);
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
      bio: friend?.bio || "",
      lastSeenAt: friend?.lastSeenAt || "",
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

function buildDiscoverOnlineList(forUser, limit = 20) {
  const userKey = normalizeName(forUser);
  const me = users.get(userKey);
  if (!me) return [];

  const exclude = new Set([userKey, ...me.friends, ...me.requests]);
  const list = [];

  for (const onlineKey of onlineUsers.keys()) {
    if (exclude.has(onlineKey)) continue;
    const user = users.get(onlineKey);
    if (!user || !user.isRegistered) continue;
    list.push({
      username: user.username || onlineKey,
      displayName: user.displayName || "",
      avatarId: user.avatarId || "",
      bio: user.bio || "",
      lastSeenAt: user.lastSeenAt || "",
    });
  }

  list.sort((a, b) => a.username.localeCompare(b.username));
  return list.slice(0, limit);
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
      lastSeenAt: user.lastSeenAt || null,
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

function removeFriendship(userAKey, userBKey) {
  const aKey = normalizeName(userAKey);
  const bKey = normalizeName(userBKey);
  const userA = users.get(aKey);
  const userB = users.get(bKey);

  if (!userA || !userB) {
    return false;
  }

  const wereFriends = userA.friends.has(bKey) || userB.friends.has(aKey);
  if (!wereFriends) {
    return false;
  }

  userA.friends.delete(bKey);
  userB.friends.delete(aKey);

  userA.requests.delete(bKey);
  userB.requests.delete(aKey);

  userA.unread.delete(bKey);
  userB.unread.delete(aKey);

  const conversationKey = getConversationKey(aKey, bKey);
  conversations.delete(conversationKey);

  return true;
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
    user.lastSeenAt = "";

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
        bio: user.bio || "",
      },
    });

    emitStatusToFriends(userKey, true);
    emitFriendList(userKey);
    schedulePersist();
  });

  socket.on("push_subscribe", (payload) => {
    const userKey = socket.data.userKey;
    if (!userKey || !pushEnabled) return;
    const subscription = payload?.subscription || payload;
    const endpoint = toDisplayName(subscription?.endpoint);
    if (!endpoint) return;
    const detached = detachSubscriptionFromAll(endpoint, userKey);
    const user = users.get(userKey);
    const updated = upsertPushSubscription(user, subscription);
    if (updated || detached) {
      schedulePersist();
    }
  });

  socket.on("push_unsubscribe", (payload) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;
    const endpoint = toDisplayName(payload?.endpoint);
    if (!endpoint) return;
    const user = users.get(userKey);
    if (removePushSubscription(user, endpoint)) {
      schedulePersist();
    }
  });

  socket.on("friend_search", (payload) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;
    const me = users.get(userKey);
    if (!me) return;
    const query = toDisplayName(payload?.query || payload);
    if (!query) {
      socket.emit("friend_suggestions", { query: "", suggestions: [] });
      return;
    }
    const suggestions = buildFriendSearchSuggestions(query, me, 8);
    socket.emit("friend_suggestions", { query, suggestions });
  });

  socket.on("discover_online", () => {
    const userKey = socket.data.userKey;
    if (!userKey) return;
    const list = buildDiscoverOnlineList(userKey, 30);
    socket.emit("discover_online", { users: list });
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

  socket.on("change_username", (payload) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;
    const user = users.get(userKey);
    if (!user) {
      socket.emit("username_change_failed", { message: "User not found." });
      return;
    }

    const currentPassword = toDisplayName(payload?.currentPassword || payload?.password);
    const desired = toDisplayName(payload?.newUsername);

    if (!currentPassword || !verifyPassword(currentPassword, user.passwordSalt, user.passwordHash)) {
      socket.emit("username_change_failed", { message: "Incorrect password." });
      return;
    }

    const result = applyUsernameChange(userKey, desired);
    if (!result.ok) {
      socket.emit("username_change_failed", { message: result.message || "Unable to change username." });
      return;
    }

    socket.data.userKey = result.newKey;

    // Update any sockets that had the old key as active chat
    onlineUsers.forEach((socketId) => {
      const friendSocket = io.sockets.sockets.get(socketId);
      if (friendSocket?.data?.activeChatWith === result.oldKey) {
        friendSocket.data.activeChatWith = result.newKey;
      }
    });

    // Notify the user first
    socket.emit("username_changed", {
      oldUsername: result.oldUsername,
      newUsername: result.newUsername,
    });

    const impacted = new Set();
    users.forEach((other, otherKey) => {
      if (!other || otherKey === result.newKey) return;
      if (other.friends.has(result.newKey) || other.requests.has(result.newKey) || other.unread.has(result.newKey)) {
        impacted.add(otherKey);
      }
    });

    impacted.forEach((key) => {
      const socketId = onlineUsers.get(key);
      if (socketId) {
        io.to(socketId).emit("friend_username_changed", {
          oldUsername: result.oldUsername,
          newUsername: result.newUsername,
        });
      }
    });

    impacted.forEach((key) => {
      emitFriendList(key);
      emitRequests(key);
    });

    emitFriendList(result.newKey);
    emitRequests(result.newKey);
    emitStatusToFriends(result.newKey, true);
    schedulePersist();
  });

  socket.on("change_password", (payload) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;
    const user = users.get(userKey);
    if (!user) {
      socket.emit("password_change_failed", { message: "User not found." });
      return;
    }

    const currentPassword = toDisplayName(payload?.currentPassword || payload?.password);
    const nextPassword = toDisplayName(payload?.newPassword);

    if (!currentPassword || !verifyPassword(currentPassword, user.passwordSalt, user.passwordHash)) {
      socket.emit("password_change_failed", { message: "Incorrect password." });
      return;
    }
    if (!nextPassword || nextPassword.length < MIN_PASSWORD_LENGTH) {
      socket.emit("password_change_failed", {
        message: `Use at least ${MIN_PASSWORD_LENGTH} characters in password.`,
      });
      return;
    }

    const secret = createPasswordSecret(nextPassword);
    user.passwordSalt = secret.passwordSalt;
    user.passwordHash = secret.passwordHash;
    schedulePersist();

    socket.emit("password_changed");
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

  socket.on("remove_friend", (rawFriendName) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;

    const friendName = toDisplayName(rawFriendName);
    const friendKey = normalizeName(friendName);

    const me = users.get(userKey);
    const friend = users.get(friendKey);

    if (!me || !friend || !me.friends.has(friendKey)) {
      socket.emit("error_message", { message: "This user is not in your friends list." });
      return;
    }

    const removed = removeFriendship(userKey, friendKey);
    if (!removed) {
      socket.emit("error_message", { message: "Could not remove friend. Try again." });
      return;
    }

    if (socket.data.activeChatWith === friendKey) {
      socket.data.activeChatWith = null;
    }

    const friendSocketId = onlineUsers.get(friendKey);
    if (friendSocketId) {
      const friendSocket = io.sockets.sockets.get(friendSocketId);
      if (friendSocket && friendSocket.data.activeChatWith === userKey) {
        friendSocket.data.activeChatWith = null;
      }
    }

    socket.emit("typing", {
      from: friend.username,
      isTyping: false,
    });

    if (friendSocketId) {
      io.to(friendSocketId).emit("typing", {
        from: me.username,
        isTyping: false,
      });
    }

    emitFriendList(userKey);
    emitFriendList(friendKey);
    emitRequests(userKey);
    emitRequests(friendKey);

    socket.emit("friend_removed", {
      username: friend.username,
      by: me.username,
    });

    if (friendSocketId) {
      io.to(friendSocketId).emit("friend_removed", {
        username: me.username,
        by: me.username,
      });
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

  socket.on("set_active_chat", (rawFriendName) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;

    const friendName = toDisplayName(rawFriendName);
    if (!friendName) {
      socket.data.activeChatWith = null;
      return;
    }

    const friendKey = normalizeName(friendName);
    const me = users.get(userKey);
    if (!me || !me.friends.has(friendKey)) {
      socket.data.activeChatWith = null;
      return;
    }

    socket.data.activeChatWith = friendKey;
  });

  socket.on("private_message", (payload) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;

    const to = toDisplayName(payload?.to);
    const text = withUploadToken(payload?.text);
    const clientTempId = String(payload?.clientTempId || "").trim();
    const safeClientTempId = clientTempId.slice(0, 64);
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
      deletedAt: null,
      reactions: {},
    };
    if (safeClientTempId) message.clientTempId = safeClientTempId;
    if (payload?.replyTo && payload.replyTo.id) {
      message.replyTo = {
        id: toDisplayName(payload.replyTo.id),
        from: toDisplayName(payload.replyTo.from),
        text: toDisplayName(payload.replyTo.text),
      };
    }

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

    if (!recipientSocketId) {
      const bodyText = formatPushBody(text);
      void sendPushToUser(toKey, {
        type: "message",
        title: `New message from ${me.username}`,
        body: bodyText,
        tag: `msg-${userKey}`,
        url: `/?source=push&chat=${encodeURIComponent(me.username)}`,
        icon: "/icons/icon-192.png",
        badge: "/icons/novyn-badge.svg",
      });
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

  socket.on("call_invite", (payload) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;

    const to = toDisplayName(payload?.to);
    const toKey = normalizeName(to);
    if (!toKey) return;

    const me = users.get(userKey);
    const friend = users.get(toKey);
    if (!me || !friend || !me.friends.has(toKey)) {
      socket.emit("error_message", { message: "You can call only friends." });
      return;
    }

    if (activeCalls.has(userKey) || activeCalls.has(toKey)) {
      socket.emit("call_busy", { to: friend.username });
      return;
    }

    const friendSocketId = onlineUsers.get(toKey);
    if (!friendSocketId) {
      socket.emit("call_unavailable", { to: friend.username });
      return;
    }

    setCallPair(userKey, toKey, "ringing");
    io.to(friendSocketId).emit("call_invite", {
      from: me.username,
      type: payload?.type || "audio",
    });
    socket.emit("call_ringing", { to: friend.username });
  });

  socket.on("call_answer", (payload) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;

    const toKey = normalizeName(payload?.to);
    const state = activeCalls.get(userKey);
    if (!state || (toKey && state.peerKey !== toKey)) return;

    const peerKey = state.peerKey;
    setCallPair(userKey, peerKey, "active");

    const peerSocketId = onlineUsers.get(peerKey);
    if (peerSocketId) {
      io.to(peerSocketId).emit("call_answer", {
        from: users.get(userKey)?.username || userKey,
      });
    }
  });

  socket.on("call_reject", (payload) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;

    const toKey = normalizeName(payload?.to);
    const state = activeCalls.get(userKey);
    if (!state || (toKey && state.peerKey !== toKey)) return;

    const peerKey = clearCallPair(userKey);
    if (!peerKey) return;

    const peerSocketId = onlineUsers.get(peerKey);
    if (peerSocketId) {
      io.to(peerSocketId).emit("call_reject", {
        from: users.get(userKey)?.username || userKey,
      });
    }
  });

  socket.on("call_cancel", (payload) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;

    const toKey = normalizeName(payload?.to);
    const state = activeCalls.get(userKey);
    if (!state || (toKey && state.peerKey !== toKey)) return;

    const peerKey = clearCallPair(userKey);
    if (!peerKey) return;

    const peerSocketId = onlineUsers.get(peerKey);
    if (peerSocketId) {
      io.to(peerSocketId).emit("call_cancelled", {
        from: users.get(userKey)?.username || userKey,
      });
    }
  });

  socket.on("call_end", (payload) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;

    const toKey = normalizeName(payload?.to);
    const state = activeCalls.get(userKey);
    if (!state || (toKey && state.peerKey !== toKey)) return;

    const peerKey = clearCallPair(userKey);
    if (!peerKey) return;

    const peerSocketId = onlineUsers.get(peerKey);
    if (peerSocketId) {
      io.to(peerSocketId).emit("call_end", {
        from: users.get(userKey)?.username || userKey,
      });
    }
  });

  socket.on("call_signal", (payload) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;

    const toKey = normalizeName(payload?.to);
    if (!toKey) return;

    const state = activeCalls.get(userKey);
    if (!state || state.peerKey !== toKey) return;

    const friendSocketId = onlineUsers.get(toKey);
    if (!friendSocketId) return;

    const me = users.get(userKey);
    io.to(friendSocketId).emit("call_signal", {
      from: me?.username || userKey,
      type: payload?.type,
      sdp: payload?.sdp || null,
      candidate: payload?.candidate || null,
    });
  });

  socket.on("update_profile", (payload) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;
    const user = users.get(userKey);
    if (!user) return;
    if (payload?.avatarId !== undefined) user.avatarId = toDisplayName(payload.avatarId).slice(0, 32);
    if (payload?.age !== undefined) user.age = toDisplayName(payload.age).slice(0, 3);
    if (payload?.gender !== undefined) user.gender = toDisplayName(payload.gender).slice(0, 20);
    if (payload?.displayName !== undefined) user.displayName = toDisplayName(payload.displayName).slice(0, 32);
    if (payload?.bio !== undefined) user.bio = toDisplayName(payload.bio).slice(0, 120);
    socket.emit("profile_updated", {
      avatarId: user.avatarId, age: user.age, gender: user.gender, displayName: user.displayName, bio: user.bio,
    });
    for (const friendKey of user.friends) {
      const friendSocket = onlineUsers.get(friendKey);
      if (friendSocket) {
        io.to(friendSocket).emit("friend_profile_updated", {
          username: user.username, avatarId: user.avatarId, displayName: user.displayName, bio: user.bio,
        });
      }
    }
    schedulePersist();
  });

  socket.on("react", (payload) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;
    const messageId = toDisplayName(payload?.messageId);
    const emoji = toDisplayName(payload?.emoji);
    const toKey = normalizeName(payload?.to);
    if (!messageId || !emoji || !toKey) return;
    const me = users.get(userKey);
    if (!me || !me.friends.has(toKey)) return;
    const convKey = getConversationKey(userKey, toKey);
    const conv = conversations.get(convKey) || [];
    const message = conv.find((m) => m.id === messageId);
    if (!message) return;
    if (!message.reactions) message.reactions = {};
    if (!message.reactions[emoji]) message.reactions[emoji] = { count: 0, userKeys: [] };
    const entry = message.reactions[emoji];
    const alreadyIdx = entry.userKeys.indexOf(userKey);
    if (alreadyIdx >= 0) {
      entry.userKeys.splice(alreadyIdx, 1);
      entry.count = Math.max(0, entry.count - 1);
    } else {
      entry.userKeys.push(userKey);
      entry.count++;
    }
    function buildReactionPayload(forUserKey) {
      const out = {};
      for (const [em, data] of Object.entries(message.reactions)) {
        if (data.count > 0) out[em] = { count: data.count, mine: data.userKeys.includes(forUserKey) };
      }
      return out;
    }
    const senderSocket = onlineUsers.get(userKey);
    const recipientSocket = onlineUsers.get(toKey);
    if (senderSocket) io.to(senderSocket).emit("reaction_updated", { messageId, reactions: buildReactionPayload(userKey) });
    if (recipientSocket) io.to(recipientSocket).emit("reaction_updated", { messageId, reactions: buildReactionPayload(toKey) });
    schedulePersist();
  });

  socket.on("delete_message", (payload) => {
    const userKey = socket.data.userKey;
    if (!userKey) return;

    const messageId = toDisplayName(payload?.messageId);
    const to = toDisplayName(payload?.to);
    const toKey = normalizeName(to);
    if (!messageId || !toKey) return;

    const me = users.get(userKey);
    const friend = users.get(toKey);
    if (!me || !friend || !me.friends.has(toKey)) {
      socket.emit("error_message", { message: "You can delete messages only in active friend chats." });
      return;
    }

    const conversationKey = getConversationKey(userKey, toKey);
    const conversation = conversations.get(conversationKey) || [];
    const message = conversation.find((entry) => entry.id === messageId);
    if (!message) {
      socket.emit("error_message", { message: "Message not found." });
      return;
    }

    if (message.fromKey !== userKey) {
      socket.emit("error_message", { message: "You can delete only your own messages." });
      return;
    }

    if (message.deletedAt) {
      return;
    }

    message.deletedAt = nowIso();
    message.text = DELETED_MESSAGE_TEXT;
    message.reactions = {};

    socket.emit("message_deleted", {
      messageId: message.id,
      with: friend.username,
      text: message.text,
      deletedAt: message.deletedAt,
      by: me.username,
    });

    const friendSocket = onlineUsers.get(toKey);
    if (friendSocket) {
      io.to(friendSocket).emit("message_deleted", {
        messageId: message.id,
        with: me.username,
        text: message.text,
        deletedAt: message.deletedAt,
        by: me.username,
      });
    }

    emitFriendList(userKey);
    emitFriendList(toKey);
    schedulePersist();
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

        user.lastSeenAt = nowIso();
      }

      const callPeerKey = clearCallPair(userKey);
      if (callPeerKey) {
        const peerSocketId = onlineUsers.get(callPeerKey);
        if (peerSocketId) {
          io.to(peerSocketId).emit("call_end", {
            from: user?.username || userKey,
          });
        }
      }

      onlineUsers.delete(userKey);
      emitStatusToFriends(userKey, false);
      schedulePersist();
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
