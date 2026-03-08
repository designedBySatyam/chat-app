function registerMessageHandlers({ socket }) {
  socket.on('mod_messages_ping', () => {
    socket.emit('mod_messages_pong', { ok: true });
  });
}

module.exports = {
  registerMessageHandlers,
};
