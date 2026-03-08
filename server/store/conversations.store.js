const conversations = new Map();

function getConversation(key) {
  return conversations.get(key) || [];
}

function setConversation(key, messages) {
  conversations.set(key, Array.isArray(messages) ? messages : []);
  return conversations.get(key);
}

function pushMessage(key, message) {
  const existing = conversations.get(key) || [];
  existing.push(message);
  conversations.set(key, existing);
  return message;
}

function clearConversation(key) {
  conversations.delete(key);
}

function rawConversationsMap() {
  return conversations;
}

module.exports = {
  getConversation,
  setConversation,
  pushMessage,
  clearConversation,
  rawConversationsMap,
};
