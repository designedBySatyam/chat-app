const REACTION_EMOJIS = [
  '\u{1F44D}', '\u2764\uFE0F', '\u{1F602}', '\u{1F62E}', '\u{1F622}', '\u{1F525}',
  '\u{1F44F}', '\u{1F60D}', '\u{1F61C}', '\u{1F914}', '\u{1F389}', '\u{1F44C}',
];

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function formatTime(iso) {
  if (!iso) return '';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeReactions(rawReactions, meKey) {
  const safe = rawReactions && typeof rawReactions === 'object' ? rawReactions : {};
  const out = {};

  Object.entries(safe).forEach(([emoji, entry]) => {
    if (!entry || typeof entry !== 'object') return;

    let count = Number.isFinite(Number(entry.count))
      ? Math.max(0, Math.floor(Number(entry.count)))
      : 0;
    let mine = Boolean(entry.mine);

    if (Array.isArray(entry.userKeys)) {
      if (!count) count = entry.userKeys.length;
      mine = entry.userKeys.some((userKey) => normalizeKey(userKey) === meKey);
    }

    if (count > 0) {
      out[emoji] = { count, mine };
    }
  });

  return out;
}

export function createMessagesView({ onReply, onReact, onDelete }) {
  const container = document.getElementById('messages');
  const scrollBtn = document.getElementById('scrollBtn');
  const scrollBadge = document.getElementById('scrollBadge');

  let me = '';
  let activeFriend = '';
  let messages = [];
  let unseenCount = 0;
  let reactionPicker = null;

  if (!container) {
    return {
      setContext() {},
      setMessages() {},
      upsertMessage() {},
      patchMessage() {},
      getMessages() { return []; },
      clear() {},
    };
  }

  function isNearBottom() {
    return container.scrollHeight - container.scrollTop - container.clientHeight < 120;
  }

  function updateScrollButton() {
    if (!scrollBtn) return;

    const show = !isNearBottom();
    scrollBtn.classList.toggle('show', show);

    if (!show) {
      unseenCount = 0;
      if (scrollBadge) {
        scrollBadge.classList.add('hidden');
        scrollBadge.textContent = '';
      }
    }
  }

  function bumpUnseen() {
    if (isNearBottom()) {
      unseenCount = 0;
      return;
    }

    unseenCount += 1;
    if (scrollBadge) {
      scrollBadge.classList.remove('hidden');
      scrollBadge.textContent = unseenCount > 9 ? '9+' : String(unseenCount);
    }
    updateScrollButton();
  }

  function closeReactionPicker() {
    if (!reactionPicker) return;
    reactionPicker.remove();
    reactionPicker = null;
  }

  function openReactionPicker(anchor, message) {
    closeReactionPicker();

    const picker = document.createElement('div');
    picker.className = 'react-picker';

    REACTION_EMOJIS.forEach((emoji) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = emoji;
      button.title = emoji;
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof onReact === 'function') {
          onReact(message, emoji);
        }
        closeReactionPicker();
      });
      picker.appendChild(button);
    });

    document.body.appendChild(picker);

    const anchorRect = anchor.getBoundingClientRect();
    const pickerRect = picker.getBoundingClientRect();
    const margin = 8;

    let left = anchorRect.left;
    if (left + pickerRect.width > window.innerWidth - margin) {
      left = window.innerWidth - pickerRect.width - margin;
    }
    if (left < margin) {
      left = margin;
    }

    let top = anchorRect.top - pickerRect.height - 8;
    if (top < margin) {
      top = anchorRect.bottom + 8;
    }

    picker.style.left = `${left}px`;
    picker.style.top = `${top}px`;
    reactionPicker = picker;
  }

  function createMeta(message, mine, ai) {
    const meta = document.createElement('span');
    meta.className = 'msg-meta';

    const timeText = formatTime(message.timestamp);
    if (mine) {
      let statusClass = 'status-icon';
      let statusText = 'Sent';

      if (message.seenAt) {
        statusClass += ' seen';
        statusText = 'Seen';
      } else if (message.deliveredAt) {
        statusText = 'Delivered';
      }

      meta.innerHTML = `${escapeHtml(timeText)} <span class="${statusClass}">${escapeHtml(statusText)}</span>`;
      return meta;
    }

    if (ai) {
      meta.textContent = `Novyn AI${timeText ? ` · ${timeText}` : ''}`;
      return meta;
    }

    const fromText = String(message.from || '').trim() || 'Friend';
    meta.textContent = `${fromText}${timeText ? ` · ${timeText}` : ''}`;
    return meta;
  }

  function createBody(message) {
    const body = document.createElement('div');
    body.className = 'msg-body';

    if (message.deletedAt) {
      body.classList.add('deleted');
    }

    body.textContent = String(message.text || '').trim() || '';
    return body;
  }

  function createReplyQuote(message) {
    if (!message.replyTo || !message.replyTo.id) return null;

    const wrap = document.createElement('button');
    wrap.type = 'button';
    wrap.className = 'reply-q';

    const who = document.createElement('span');
    who.className = 'rq-who';
    who.textContent = String(message.replyTo.from || 'Reply');

    const text = document.createElement('span');
    text.textContent = String(message.replyTo.text || '');

    wrap.append(who, text);
    return wrap;
  }

  function createReactionRow(message, mine) {
    const reactions = normalizeReactions(message.reactions, normalizeKey(me));
    const row = document.createElement('div');
    row.className = 'msg-reacts';

    Object.entries(reactions).forEach(([emoji, entry]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `react-btn${entry.mine ? ' mine' : ''}`;
      button.innerHTML = `${emoji} <span class="rc">${entry.count}</span>`;
      button.addEventListener('click', () => {
        if (typeof onReact === 'function') {
          onReact(message, emoji);
        }
      });
      row.appendChild(button);
    });

    if (!row.childElementCount) return null;
    return row;
  }

  function createActionRow(message, mine, ai) {
    if (ai || message.deletedAt) return null;

    const row = document.createElement('div');
    row.className = 'msg-acts';

    const replyBtn = document.createElement('button');
    replyBtn.type = 'button';
    replyBtn.className = 'mab';
    replyBtn.title = 'Reply';
    replyBtn.textContent = '↩';
    replyBtn.addEventListener('click', () => {
      if (typeof onReply === 'function') {
        onReply({
          id: message.id,
          from: message.from,
          text: message.text,
        });
      }
    });

    const reactBtn = document.createElement('button');
    reactBtn.type = 'button';
    reactBtn.className = 'mab';
    reactBtn.title = 'React';
    reactBtn.textContent = '🙂';
    reactBtn.addEventListener('click', (event) => {
      openReactionPicker(event.currentTarget, message);
    });

    row.append(replyBtn, reactBtn);

    if (mine) {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'mab';
      delBtn.title = 'Delete';
      delBtn.textContent = '🗑';
      delBtn.addEventListener('click', () => {
        if (typeof onDelete === 'function') {
          onDelete(message);
        }
      });
      row.appendChild(delBtn);
    }

    return row;
  }

  function render() {
    closeReactionPicker();

    container.innerHTML = '';

    if (!messages.length) {
      container.innerHTML = [
        '<div class="msgs-empty">',
        '  <div class="empty-ico" aria-hidden="true">💬</div>',
        '  <p class="empty-h">Nothing here yet</p>',
        '  <p class="empty-s">Start the conversation.</p>',
        '</div>',
      ].join('');
      updateScrollButton();
      return;
    }

    messages.forEach((message) => {
      const mine = normalizeKey(message.from) === normalizeKey(me);
      const ai = Boolean(message.ai);

      const article = document.createElement('article');
      article.className = `msg ${mine ? 'me' : 'them'}${ai ? ' ai-msg' : ''}`;
      article.dataset.messageId = String(message.id || '');
      article.dataset.messageFrom = String(message.from || '');
      article.dataset.messageText = String(message.text || '');

      const replyQuote = createReplyQuote(message);
      const meta = createMeta(message, mine, ai);
      const body = createBody(message);
      const actions = createActionRow(message, mine, ai);
      const reactions = createReactionRow(message, mine);

      if (replyQuote) article.appendChild(replyQuote);
      article.append(meta, body);
      if (actions) article.appendChild(actions);
      if (reactions) article.appendChild(reactions);

      container.appendChild(article);
    });

    container.scrollTop = container.scrollHeight;
    updateScrollButton();
  }

  function setMessages(nextMessages, options = {}) {
    messages = Array.isArray(nextMessages) ? [...nextMessages] : [];

    if (!options.preserveScroll) {
      unseenCount = 0;
      if (scrollBadge) {
        scrollBadge.classList.add('hidden');
        scrollBadge.textContent = '';
      }
    }

    render();
  }

  function upsertMessage(message) {
    if (!message || !message.id) return;

    const idx = messages.findIndex((entry) => entry.id === message.id);
    if (idx >= 0) {
      messages[idx] = { ...messages[idx], ...message };
    } else {
      messages.push(message);
      bumpUnseen();
    }

    render();
  }

  function patchMessage(messageId, partial) {
    const idx = messages.findIndex((entry) => entry.id === messageId);
    if (idx < 0) return;

    messages[idx] = { ...messages[idx], ...(partial || {}) };
    render();
  }

  function clear() {
    messages = [];
    render();
  }

  document.addEventListener('click', (event) => {
    if (!reactionPicker) return;
    if (event.target.closest('.react-picker')) return;
    closeReactionPicker();
  });

  container.addEventListener('scroll', updateScrollButton, { passive: true });

  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      unseenCount = 0;
      if (scrollBadge) {
        scrollBadge.classList.add('hidden');
        scrollBadge.textContent = '';
      }
      updateScrollButton();
    });
  }

  return {
    setContext({ me: meName, activeFriend: friendName }) {
      me = String(meName || '');
      activeFriend = String(friendName || '');
      void activeFriend;
    },
    setMessages,
    upsertMessage,
    patchMessage,
    getMessages() {
      return [...messages];
    },
    clear,
  };
}
