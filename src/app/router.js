function applyRoute(route) {
  const loginCard = document.getElementById('loginCard');
  const chatLayout = document.getElementById('chatLayout');

  if (!loginCard || !chatLayout) return;

  const showChat = route === 'chat';
  loginCard.classList.toggle('hidden', showChat);
  chatLayout.classList.toggle('hidden', !showChat);
}

export function initRouter({ store }) {
  applyRoute(store.get('route'));

  store.subscribe((state) => {
    applyRoute(state.route || 'login');
  });
}
