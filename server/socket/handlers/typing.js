function registerTypingHandlers({ socket }) {
  socket.on('mod_typing_ping', () => {
    socket.emit('mod_typing_pong', { ok: true });
  });
}

module.exports = {
  registerTypingHandlers,
};
