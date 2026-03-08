function registerAuthHandlers({ socket }) {
  socket.on('mod_auth_ping', () => {
    socket.emit('mod_auth_pong', { ok: true });
  });
}

module.exports = {
  registerAuthHandlers,
};
