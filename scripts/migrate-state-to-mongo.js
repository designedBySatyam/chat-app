const fs = require("fs/promises");
const path = require("path");
const { MongoClient } = require("mongodb");

const STATE_FILE = process.env.STATE_FILE
  ? path.resolve(process.cwd(), process.env.STATE_FILE)
  : path.join(process.cwd(), "data", "chat-state.json");
const MONGODB_URI = String(process.env.MONGODB_URI || "").trim();
const MONGODB_DB = String(process.env.MONGODB_DB || "novyn").trim() || "novyn";
const MONGODB_COLLECTION =
  String(process.env.MONGODB_COLLECTION || "chat_state").trim() || "chat_state";
const CHAT_RETENTION_DAYS = Math.max(
  1,
  Number.isFinite(Number(process.env.CHAT_RETENTION_DAYS))
    ? Math.floor(Number(process.env.CHAT_RETENTION_DAYS))
    : 30
);

async function readStateFile() {
  const raw = await fs.readFile(STATE_FILE, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("State file does not contain a JSON object.");
  }

  if (!Array.isArray(parsed.users) || !Array.isArray(parsed.conversations)) {
    throw new Error("State file must contain users[] and conversations[].");
  }

  return parsed;
}

async function migrate() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI. Use the same Mongo URI configured on Render.");
  }

  const state = await readStateFile();
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const collection = client.db(MONGODB_DB).collection(MONGODB_COLLECTION);
    const now = new Date();

    const result = await collection.updateOne(
      { _id: "main" },
      {
        $set: {
          _id: "main",
          state,
          updatedAt: now,
          retentionDays: CHAT_RETENTION_DAYS,
          migratedFromFile: path.basename(STATE_FILE),
          migratedAt: now,
        },
      },
      { upsert: true }
    );

    const users = state.users.length;
    const conversations = state.conversations.length;
    const messages = state.conversations.reduce(
      (sum, entry) => sum + (Array.isArray(entry.messages) ? entry.messages.length : 0),
      0
    );

    console.log("Migration complete.");
    console.log(`Mongo DB: ${MONGODB_DB}`);
    console.log(`Collection: ${MONGODB_COLLECTION}`);
    console.log(`State file: ${STATE_FILE}`);
    console.log(`Users: ${users}`);
    console.log(`Conversations: ${conversations}`);
    console.log(`Messages: ${messages}`);
    console.log(`Matched: ${result.matchedCount}`);
    console.log(`Modified: ${result.modifiedCount}`);
    console.log(`Upserted: ${result.upsertedCount}`);
  } finally {
    await client.close();
  }
}

migrate().catch((error) => {
  console.error("State migration failed:");
  console.error(error.message || error);
  process.exit(1);
});