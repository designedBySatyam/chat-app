export function createTypingBar() {
  const root = document.getElementById('typingIndicator');
  const text = document.getElementById('typingText');
  let hideTimer = 0;

  function show(label) {
    if (!root) return;
    if (text) {
      text.textContent = label || 'Typing...';
    }
    root.classList.remove('hidden');

    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      root.classList.add('hidden');
    }, 1800);
  }

  function hide() {
    if (!root) return;
    clearTimeout(hideTimer);
    root.classList.add('hidden');
  }

  return {
    show,
    hide,
  };
}
