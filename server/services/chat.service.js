function normalizeName(name) {
  return String(name || '').trim().toLowerCase();
}

function toDisplayName(name) {
  return String(name || '').trim();
}

function nowIso() {
  return new Date().toISOString();
}

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getConversationKey(userA, userB) {
  const a = normalizeName(userA);
  const b = normalizeName(userB);
  return [a, b].sort().join('::');
}

module.exports = {
  normalizeName,
  toDisplayName,
  nowIso,
  createMessageId,
  getConversationKey,
};
