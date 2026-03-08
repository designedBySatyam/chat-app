const EMOJIS = [
  '\u{1F600}', '\u{1F601}', '\u{1F602}', '\u{1F923}', '\u{1F60A}', '\u{1F60D}', '\u{1F618}', '\u{1F609}',
  '\u{1F44D}', '\u{1F44E}', '\u{1F64C}', '\u{1F44F}', '\u{1F525}', '\u2728', '\u{1F49C}', '\u{1F389}',
  '\u{1F680}', '\u{1F31F}', '\u{1F440}', '\u{1F4AC}', '\u{1F914}', '\u{1F605}', '\u{1F973}', '\u{1F64F}',
  '\u{1F60E}', '\u{1F60D}', '\u{1F91D}', '\u2764\uFE0F', '\u{1F44C}', '\u{1F3AF}', '\u{1F4AF}', '\u{1F319}',
];

function createEmojiPicker({ toggle, input }) {
  if (!toggle || !input) {
    return {
      close() {},
    };
  }

  let picker = null;

  function insertEmoji(emoji) {
    const start = Number.isFinite(input.selectionStart) ? input.selectionStart : input.value.length;
    const end = Number.isFinite(input.selectionEnd) ? input.selectionEnd : input.value.length;

    input.value = `${input.value.slice(0, start)}${emoji}${input.value.slice(end)}`;
    const nextPos = start + emoji.length;

    input.focus();
    if (typeof input.setSelectionRange === 'function') {
      input.setSelectionRange(nextPos, nextPos);
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function close() {
    if (!picker) return;
    picker.remove();
    picker = null;
    toggle.setAttribute('aria-expanded', 'false');
  }

  function open() {
    if (picker) return;

    picker = document.createElement('div');
    picker.className = 'composer-emoji-picker';

    EMOJIS.forEach((emoji) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'composer-emoji-btn';
      button.textContent = emoji;
      button.title = emoji;
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        insertEmoji(emoji);
      });
      picker.appendChild(button);
    });

    document.body.appendChild(picker);

    const rect = toggle.getBoundingClientRect();
    const pickerRect = picker.getBoundingClientRect();
    const margin = 8;

    let left = rect.left;
    if (left + pickerRect.width > window.innerWidth - margin) {
      left = window.innerWidth - pickerRect.width - margin;
    }
    if (left < margin) {
      left = margin;
    }

    let top = rect.top - pickerRect.height - 8;
    if (top < margin) {
      top = rect.bottom + 8;
    }
    if (top + pickerRect.height > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - pickerRect.height - margin);
    }

    picker.style.left = `${left}px`;
    picker.style.top = `${top}px`;

    toggle.setAttribute('aria-expanded', 'true');
  }

  toggle.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (picker) {
      close();
    } else {
      open();
    }
  });

  document.addEventListener('click', (event) => {
    if (!picker) return;
    if (event.target.closest('.composer-emoji-picker')) return;
    if (event.target.closest('#emojiToggle')) return;
    close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  window.addEventListener('resize', close, { passive: true });
  window.addEventListener('scroll', close, { passive: true });

  return {
    close,
  };
}

export function createComposer({ onSubmit, onTyping, onPolish }) {
  const form = document.getElementById('messageForm');
  const input = document.getElementById('messageInput');
  const emojiToggle = document.getElementById('emojiToggle');
  const polishBtn = document.getElementById('aiPolishBtn');
  const charCounter = document.getElementById('charCounter');
  const replyBar = document.getElementById('replyBar');
  const replyPreview = document.getElementById('replyPreview');
  const cancelReplyBtn = document.getElementById('cancelReplyBtn');

  if (!form || !input) {
    return {
      setEnabled() {},
      setPlaceholder() {},
      focus() {},
      setText() {},
      getText() { return ''; },
      clear() {},
      setReply() {},
      clearReply() {},
      setBusy() {},
      flash() {},
    };
  }

  let busy = false;
  let typingActive = false;
  let typingTimer = 0;
  let replyPayload = null;

  function updateCharCounter() {
    if (!charCounter) return;

    const len = input.value.length;
    if (!len) {
      charCounter.classList.add('hidden');
      charCounter.classList.remove('warn', 'over');
      charCounter.textContent = '0 / 1000';
      return;
    }

    charCounter.classList.remove('hidden', 'warn', 'over');
    if (len >= 1000) charCounter.classList.add('over');
    else if (len >= 800) charCounter.classList.add('warn');

    charCounter.textContent = `${len} / 1000`;
  }

  function emitTyping(isTyping) {
    if (typeof onTyping !== 'function') return;
    onTyping(Boolean(isTyping));
  }

  function stopTyping() {
    if (!typingActive) return;
    typingActive = false;
    emitTyping(false);
  }

  function markTyping() {
    if (!typingActive) {
      typingActive = true;
      emitTyping(true);
    }

    clearTimeout(typingTimer);
    typingTimer = window.setTimeout(() => {
      stopTyping();
    }, 1200);
  }

  function setReply(payload) {
    replyPayload = payload || null;

    if (!replyBar || !replyPreview) return;

    if (!replyPayload || !replyPayload.id) {
      replyBar.classList.add('hidden');
      replyPreview.textContent = '';
      return;
    }

    const from = String(replyPayload.from || '').trim() || 'Unknown';
    const text = String(replyPayload.text || '').trim();
    replyPreview.textContent = `${from}: ${text}`;
    replyBar.classList.remove('hidden');
  }

  function clearReply() {
    setReply(null);
  }

  function setBusy(nextBusy) {
    busy = Boolean(nextBusy);

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = busy;
    if (polishBtn) polishBtn.disabled = busy;
  }

  function flash() {
    input.style.transition = 'background-color 220ms ease';
    input.style.backgroundColor = 'rgba(167,139,250,0.2)';
    window.setTimeout(() => {
      input.style.backgroundColor = '';
    }, 320);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (busy) return;

    const text = input.value.trim();
    if (!text) return;

    const activeReply = replyPayload;

    const result = await Promise.resolve(
      typeof onSubmit === 'function' ? onSubmit(text, activeReply) : true
    );

    if (result === false) return;

    input.value = '';
    updateCharCounter();
    clearReply();
    stopTyping();
    input.focus();
  });

  input.addEventListener('input', () => {
    updateCharCounter();

    if (input.value.trim()) {
      markTyping();
    } else {
      stopTyping();
    }
  });

  input.addEventListener('blur', () => {
    stopTyping();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  if (cancelReplyBtn) {
    cancelReplyBtn.addEventListener('click', () => {
      clearReply();
      input.focus();
    });
  }

  if (polishBtn) {
    polishBtn.addEventListener('click', async () => {
      if (busy) return;

      const draft = input.value.trim();
      if (!draft) return;

      setBusy(true);
      polishBtn.classList.add('spin');

      try {
        const polished = await Promise.resolve(
          typeof onPolish === 'function' ? onPolish(draft) : draft
        );

        if (typeof polished === 'string' && polished.trim()) {
          input.value = polished.trim();
          updateCharCounter();
          flash();
          input.focus();
        }
      } finally {
        polishBtn.classList.remove('spin');
        setBusy(false);
      }
    });
  }

  createEmojiPicker({ toggle: emojiToggle, input });
  updateCharCounter();

  return {
    setEnabled(enabled) {
      input.disabled = !enabled;
      input.readOnly = !enabled;
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = !enabled;
      if (polishBtn) polishBtn.disabled = !enabled;
    },
    setPlaceholder(value) {
      input.placeholder = value || '';
    },
    focus() {
      input.focus();
    },
    setText(value) {
      input.value = String(value || '');
      updateCharCounter();
    },
    getText() {
      return input.value;
    },
    clear() {
      input.value = '';
      updateCharCounter();
      clearReply();
      stopTyping();
    },
    setReply,
    clearReply,
    setBusy,
    flash,
  };
}
