export function createToastController() {
  const toast = document.getElementById('toast');
  let timer = 0;

  function show(message, kind = 'ok', ms = 2200) {
    if (!toast) return;

    clearTimeout(timer);
    toast.textContent = String(message || '').trim() || 'Done';
    toast.classList.remove('hidden', 'ok', 'err');
    toast.classList.add(kind === 'err' ? 'err' : 'ok');

    timer = window.setTimeout(() => {
      toast.classList.add('hidden');
    }, ms);
  }

  return {
    show,
  };
}
