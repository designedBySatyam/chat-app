function registerReactionHandlers({ socket }) {
  socket.on('mod_reactions_ping', () => {
    socket.emit('mod_reactions_pong', { ok: true });
  });
}

module.exports = {
  registerReactionHandlers,
};
