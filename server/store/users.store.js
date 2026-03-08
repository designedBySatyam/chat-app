const users = new Map();

function getUser(key) {
  return users.get(key);
}

function setUser(key, value) {
  users.set(key, value);
  return value;
}

function hasUser(key) {
  return users.has(key);
}

function deleteUser(key) {
  return users.delete(key);
}

function listUsers() {
  return Array.from(users.values());
}

function rawUsersMap() {
  return users;
}

module.exports = {
  getUser,
  setUser,
  hasUser,
  deleteUser,
  listUsers,
  rawUsersMap,
};
