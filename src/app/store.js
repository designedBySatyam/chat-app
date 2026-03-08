const DEFAULT_STATE = {
  route: 'login',
  me: '',
};

export function createAppStore(initialState = {}) {
  let state = {
    ...DEFAULT_STATE,
    ...initialState,
  };

  const listeners = new Set();

  function notify() {
    listeners.forEach((listener) => listener(state));
  }

  return {
    getState() {
      return state;
    },
    get(key) {
      return state[key];
    },
    set(key, value) {
      state = { ...state, [key]: value };
      notify();
    },
    patch(nextPartial) {
      state = { ...state, ...(nextPartial || {}) };
      notify();
    },
    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
