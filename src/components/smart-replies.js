export function createSmartReplies({ onSelect }) {
  const bar = document.getElementById('smartRepliesBar');

  function hide() {
    if (!bar) return;
    bar.classList.add('hidden');
    bar.innerHTML = '';
  }

  function showLoading() {
    if (!bar) return;
    bar.innerHTML = [
      '<span class="sr-lbl">AI suggest</span>',
      '<div class="sr-dots"><span></span><span></span><span></span></div>',
    ].join('');
    bar.classList.remove('hidden');
  }

  function show(replies = []) {
    if (!bar) return;

    const safeReplies = Array.isArray(replies)
      ? replies.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3)
      : [];

    if (!safeReplies.length) {
      hide();
      return;
    }

    bar.innerHTML = '<span class="sr-lbl">AI suggest</span>';

    safeReplies.forEach((reply) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sr-chip';
      btn.textContent = reply;
      btn.addEventListener('click', () => {
        if (typeof onSelect === 'function') {
          onSelect(reply);
        }
      });
      bar.appendChild(btn);
    });

    bar.classList.remove('hidden');
  }

  return {
    hide,
    show,
    showLoading,
  };
}
