function registerFriendHandlers({ socket }) {
  socket.on('mod_friends_ping', () => {
    socket.emit('mod_friends_pong', { ok: true });
  });
}

module.exports = {
  registerFriendHandlers,
};
