export function createSocketClient() {
  if (typeof window.io !== 'function') {
    return {
      socket: null,
      connected: false,
      on() { return () => {}; },
      emit() {},
    };
  }

  const socket = window.io({ autoConnect: true });

  return {
    socket,
    get connected() {
      return Boolean(socket.connected);
    },
    on(eventName, handler) {
      socket.on(eventName, handler);
      return () => {
        socket.off(eventName, handler);
      };
    },
    emit(eventName, payload) {
      socket.emit(eventName, payload);
    },
  };
}
