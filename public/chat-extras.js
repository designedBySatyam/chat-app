/* ─── Novyn Chat Extras ─────────────────────────────────────────────────────
   Handles: theme, logout, mobile panels, scroll FAB, char counter,
            snap typing, emoji reactions + server sync, reply UI, profile modal
   ─────────────────────────────────────────────────────────────────────────── */

/* ── Theme toggle ───────────────────────────────────────────────────────────── */
(function () {
  var root  = document.documentElement;
  var btn   = document.getElementById('themeToggle');
  var STORE = 'novyn-theme';
  function applyTheme(t) {
    t === 'light' ? root.classList.add('light') : root.classList.remove('light');
    try { localStorage.setItem(STORE, t); } catch(e) {}
  }
  var saved = 'dark';
  try { saved = localStorage.getItem(STORE) || 'dark'; } catch(e) {}
  applyTheme(saved);
  btn && btn.addEventListener('click', function () {
    applyTheme(root.classList.contains('light') ? 'dark' : 'light');
  });
})();

/* ── Logout ─────────────────────────────────────────────────────────────────── */
(function () {
  var btn = document.getElementById('logoutBtn');
  if (!btn) return;
  btn.addEventListener('click', function () { window.location.reload(); });
})();

/* ── Mobile panel switching ─────────────────────────────────────────────────── */
(function () {
  var BP      = 768;
  var sidebar = document.getElementById('mobileSidebar');
  var chat    = document.getElementById('mobileChat');
  var backBtn = document.getElementById('mobBackBtn');
  function isMobile() { return window.innerWidth <= BP; }
  function showPanel(panel) {
    if (!sidebar || !chat) return;
    if (panel === 'chat') {
      sidebar.setAttribute('data-mob-hidden', 'true');
      chat.removeAttribute('data-mob-hidden');
      if (backBtn) backBtn.setAttribute('data-visible', 'true');
    } else {
      chat.setAttribute('data-mob-hidden', 'true');
      sidebar.removeAttribute('data-mob-hidden');
      if (backBtn) backBtn.removeAttribute('data-visible');
    }
  }
  document.addEventListener('click', function (e) {
    if (!isMobile()) return;
    if (e.target.closest('.friend-btn')) showPanel('chat');
  });
  backBtn && backBtn.addEventListener('click', function () {
    if (isMobile()) showPanel('friends');
  });
  window.addEventListener('resize', function () {
    if (!isMobile()) {
      if (sidebar) sidebar.removeAttribute('data-mob-hidden');
      if (chat)    chat.removeAttribute('data-mob-hidden');
    }
  });
  new MutationObserver(function () {
    var layout = document.getElementById('chatLayout');
    if (layout && !layout.classList.contains('hidden') && isMobile()) showPanel('friends');
  }).observe(document.getElementById('chatLayout') || document.body, { attributes: true, attributeFilter: ['class'] });
})();

/* ── Scroll-to-bottom FAB ───────────────────────────────────────────────────── */
(function () {
  var messagesEl = document.getElementById('messages');
  var scrollBtn  = document.getElementById('scrollBtn');
  var badge      = document.getElementById('scrollBadge');
  var unread     = 0;
  function atBottom() {
    if (!messagesEl) return true;
    return messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight <= 150;
  }
  function checkFAB() {
    if (!scrollBtn) return;
    scrollBtn.classList.toggle('visible', !atBottom());
    if (atBottom()) {
      unread = 0;
      if (badge) { badge.textContent = ''; badge.classList.add('hidden'); }
    }
  }
  messagesEl && messagesEl.addEventListener('scroll', checkFAB, { passive: true });
  scrollBtn && scrollBtn.addEventListener('click', function () {
    if (messagesEl) messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
    unread = 0;
    if (badge) { badge.textContent = ''; badge.classList.add('hidden'); }
    checkFAB();
  });
  window._novynFAB = {
    bump: function () {
      if (!atBottom()) {
        unread++;
        if (badge) { badge.textContent = unread > 9 ? '9+' : String(unread); badge.classList.remove('hidden'); }
      }
      checkFAB();
    },
    reset: function () {
      unread = 0;
      if (badge) { badge.textContent = ''; badge.classList.add('hidden'); }
      checkFAB();
    }
  };
})();

/* ── Character counter ──────────────────────────────────────────────────────── */
(function () {
  var input   = document.getElementById('messageInput');
  var counter = document.getElementById('charCounter');
  var MAX = 1000, WARN = 800;
  if (!input || !counter) return;
  input.addEventListener('input', function () {
    var len = input.value.length;
    if (len === 0) { counter.classList.add('hidden'); return; }
    counter.classList.remove('hidden', 'warn', 'limit');
    counter.textContent = len + ' / ' + MAX;
    if (len >= MAX) counter.classList.add('limit');
    else if (len >= WARN) counter.classList.add('warn');
  });
})();

/* ── Emoji Reactions + Reply button ─────────────────────────────────────────── */
(function () {
  var EMOJIS     = ['👍','❤️','😂','😮','😢','🔥'];
  var messagesEl = document.getElementById('messages');
  if (!messagesEl) return;

  var reactionStore    = {};
  var activePickerMsgEl = null;

  function getStore(id) {
    if (!reactionStore[id]) reactionStore[id] = {};
    return reactionStore[id];
  }

  function closePicker() {
    var open = document.querySelector('.reaction-picker');
    if (open) open.remove();
    activePickerMsgEl = null;
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.reaction-picker') && !e.target.closest('.msg-action-btn')) {
      closePicker();
    }
  });

  function renderReactions(msgEl, msgId) {
    var wrap = msgEl.querySelector('.message-reactions');
    if (!wrap) return;
    wrap.innerHTML = '';
    var store = getStore(msgId);
    Object.keys(store).forEach(function (emoji) {
      var entry = store[emoji];
      if (!entry || entry.count <= 0) return;
      var btn = document.createElement('button');
      btn.className = 'reaction-btn' + (entry.mine ? ' mine' : '');
      btn.dataset.emoji = emoji;
      btn.innerHTML = emoji + '<span class="r-count">' + entry.count + '</span>';
      btn.addEventListener('click', function () { sendReaction(msgEl, msgId, emoji); });
      wrap.appendChild(btn);
    });
  }

  function sendReaction(msgEl, msgId, emoji) {
    var toUser = msgEl.dataset.messageFrom;
    if (window._novynMe && window._novynMe() && toUser === window._novynMe()) {
      toUser = window._novynActiveFriend && window._novynActiveFriend();
    }
    if (!toUser) return;

    // Optimistic update
    var store = getStore(msgId);
    if (!store[emoji]) store[emoji] = { count: 0, mine: false };
    if (store[emoji].mine) {
      store[emoji].count = Math.max(0, store[emoji].count - 1);
      store[emoji].mine  = false;
    } else {
      store[emoji].count++;
      store[emoji].mine = true;
    }
    renderReactions(msgEl, msgId);
    closePicker();

    if (window._novynSocket) {
      window._novynSocket.emit('react', { messageId: msgId, emoji: emoji, to: toUser });
    }
  }

  function applyServerReactions(msgId, reactions) {
    reactionStore[msgId] = reactionStore[msgId] || {};
    Object.keys(reactions).forEach(function(emoji) {
      reactionStore[msgId][emoji] = reactions[emoji];
    });
    Object.keys(reactionStore[msgId]).forEach(function(emoji) {
      if (!reactions[emoji]) reactionStore[msgId][emoji] = { count: 0, mine: false };
    });
    var msgEl = messagesEl.querySelector('[data-message-id="' + msgId + '"]');
    if (msgEl) renderReactions(msgEl, msgId);
  }

  function addActionsUI(msgEl) {
    var msgId = msgEl.dataset.messageId || ('tmp-' + Date.now() + '-' + Math.random());
    if (!msgEl.dataset.messageId) msgEl.dataset.messageId = msgId;

    var actions = document.createElement('div');
    actions.className = 'msg-actions';

    // Reply button
    var replyBtn = document.createElement('button');
    replyBtn.className = 'msg-action-btn';
    replyBtn.title     = 'Reply';
    replyBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>';
    replyBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (window._novynReply) {
        window._novynReply.setReply({
          id: msgEl.dataset.messageId,
          from: msgEl.dataset.messageFrom || '',
          text: msgEl.dataset.messageText || '',
        });
      }
    });

    // Emoji button
    var emojiBtn = document.createElement('button');
    emojiBtn.className = 'msg-action-btn';
    emojiBtn.title     = 'React';
    emojiBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>';
    emojiBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (activePickerMsgEl === msgEl) { closePicker(); return; }
      closePicker();
      activePickerMsgEl = msgEl;

      var picker = document.createElement('div');
      picker.className = 'reaction-picker';
      EMOJIS.forEach(function (emoji) {
        var b = document.createElement('button');
        b.textContent = emoji;
        b.title = emoji;
        b.addEventListener('click', function (ev) {
          ev.stopPropagation();
          sendReaction(msgEl, msgId, emoji);
        });
        picker.appendChild(b);
      });
      var rect = emojiBtn.getBoundingClientRect();
      picker.style.position = 'fixed';
      picker.style.bottom   = (window.innerHeight - rect.top + 6) + 'px';
      picker.style.left     = rect.left + 'px';
      picker.style.zIndex   = '9999';
      document.body.appendChild(picker);
    });

    actions.append(replyBtn, emojiBtn);
    msgEl.appendChild(actions);

    var reactWrap = document.createElement('div');
    reactWrap.className = 'message-reactions';
    msgEl.appendChild(reactWrap);

    renderReactions(msgEl, msgId);
  }

  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeType === 1 && node.tagName === 'ARTICLE' && node.classList.contains('message')) {
          addActionsUI(node);
        }
      });
    });
  });
  observer.observe(messagesEl, { childList: true });

  window._novynReactions = {
    store: reactionStore,
    applyServerReactions: applyServerReactions,
  };
})();

/* ── Profile Modal ──────────────────────────────────────────────────────────── */
(function () {
  var AVATARS = [
    { id: 'av-ghost',     bg: 'linear-gradient(135deg,#667eea,#764ba2)', emoji: '👻' },
    { id: 'av-alien',     bg: 'linear-gradient(135deg,#11998e,#38ef7d)', emoji: '👽' },
    { id: 'av-robot',     bg: 'linear-gradient(135deg,#fc4a1a,#f7b733)', emoji: '🤖' },
    { id: 'av-cat',       bg: 'linear-gradient(135deg,#f953c6,#b91d73)', emoji: '🐱' },
    { id: 'av-fox',       bg: 'linear-gradient(135deg,#f7971e,#ffd200)', emoji: '🦊' },
    { id: 'av-bear',      bg: 'linear-gradient(135deg,#8B5E3C,#d4a96a)', emoji: '🐻' },
    { id: 'av-panda',     bg: 'linear-gradient(135deg,#2c3e50,#bdc3c7)', emoji: '🐼' },
    { id: 'av-wolf',      bg: 'linear-gradient(135deg,#4b6cb7,#182848)', emoji: '🐺' },
    { id: 'av-dragon',    bg: 'linear-gradient(135deg,#00c6ff,#0072ff)', emoji: '🐲' },
    { id: 'av-ninja',     bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', emoji: '🥷' },
    { id: 'av-wizard',    bg: 'linear-gradient(135deg,#6a11cb,#2575fc)', emoji: '🧙' },
    { id: 'av-astronaut', bg: 'linear-gradient(135deg,#0f0c29,#302b63)', emoji: '👨‍🚀' },
    { id: 'av-angel',     bg: 'linear-gradient(135deg,#f0c27f,#fc67fa)', emoji: '😇' },
    { id: 'av-demon',     bg: 'linear-gradient(135deg,#870000,#190a05)', emoji: '😈' },
    { id: 'av-cool',      bg: 'linear-gradient(135deg,#00b09b,#96c93d)', emoji: '😎' },
    { id: 'av-fire',      bg: 'linear-gradient(135deg,#f12711,#f5af19)', emoji: '🔥' },
    { id: 'av-snow',      bg: 'linear-gradient(135deg,#a1c4fd,#c2e9fb)', emoji: '❄️' },
    { id: 'av-star',      bg: 'linear-gradient(135deg,#f7971e,#ffd200)', emoji: '⭐' },
    { id: 'av-diamond',   bg: 'linear-gradient(135deg,#00c6ff,#0072ff)', emoji: '💎' },
    { id: 'av-crown',     bg: 'linear-gradient(135deg,#f7971e,#ffd200)', emoji: '👑' },
    { id: 'av-skull',     bg: 'linear-gradient(135deg,#232526,#414345)', emoji: '💀' },
    { id: 'av-clown',     bg: 'linear-gradient(135deg,#fc4a1a,#f7b733)', emoji: '🤡' },
    { id: 'av-sunflower', bg: 'linear-gradient(135deg,#f9d423,#ff4e50)', emoji: '🌻' },
    { id: 'av-planet',    bg: 'linear-gradient(135deg,#141e30,#243b55)', emoji: '🪐' },
  ];

  var modal       = document.getElementById('profileModal');
  var backdrop    = modal && modal.querySelector('.profile-modal-backdrop');
  var closeBtn    = document.getElementById('profileModalClose');
  var openBtn     = document.getElementById('profileBtn');
  var saveBtn     = document.getElementById('profileSaveBtn');
  var avatarBig   = document.getElementById('profileAvatarBig');
  var avatarGrid  = document.getElementById('profileAvatarGrid');
  var inputName   = document.getElementById('profileDisplayName');
  var inputAge    = document.getElementById('profileAge');
  var inputGender = document.getElementById('profileGender');

  var currentAvatarId = '';

  function getAvatarById(id) {
    return AVATARS.find(function(a){ return a.id === id; }) || null;
  }

  function applyAvatarToEl(el, avatarId, fallbackText) {
    var av = getAvatarById(avatarId);
    if (av) {
      el.style.background = av.bg;
      el.textContent = av.emoji;
    } else {
      el.style.background = '';
      el.textContent = fallbackText || '?';
    }
  }

  // Build avatar grid
  if (avatarGrid) {
    AVATARS.forEach(function(av) {
      var btn = document.createElement('button');
      btn.className = 'av-grid-btn';
      btn.type = 'button';
      btn.title = av.emoji;
      btn.dataset.avId = av.id;
      btn.style.background = av.bg;
      btn.textContent = av.emoji;
      btn.addEventListener('click', function() {
        currentAvatarId = av.id;
        if (avatarBig) {
          avatarBig.style.background = av.bg;
          avatarBig.textContent = av.emoji;
        }
        document.querySelectorAll('.av-grid-btn').forEach(function(b){ b.classList.remove('selected'); });
        btn.classList.add('selected');
      });
      avatarGrid.appendChild(btn);
    });
  }

  function showModal() {
    if (!modal) return;
    modal.style.display = 'flex';
    var p = window._novynProfile || {};
    currentAvatarId = p.avatarId || '';
    if (inputName)   inputName.value   = p.displayName || '';
    if (inputAge)    inputAge.value    = p.age || '';
    if (inputGender) inputGender.value = p.gender || '';
    if (avatarBig) {
      var me = window._novynMe ? window._novynMe() : '';
      applyAvatarToEl(avatarBig, currentAvatarId, (me || '?').slice(0,2).toUpperCase());
    }
    document.querySelectorAll('.av-grid-btn').forEach(function(b) {
      b.classList.toggle('selected', b.dataset.avId === currentAvatarId);
    });
  }

  function hideModal() {
    if (!modal) return;
    modal.style.display = 'none';
  }

  openBtn  && openBtn.addEventListener('click', showModal);
  closeBtn && closeBtn.addEventListener('click', hideModal);
  backdrop && backdrop.addEventListener('click', hideModal);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal && modal.style.display !== 'none') hideModal();
  });

  saveBtn && saveBtn.addEventListener('click', function() {
    var payload = {
      avatarId: currentAvatarId,
      displayName: inputName   ? inputName.value.trim()   : '',
      age:         inputAge    ? inputAge.value.trim()    : '',
      gender:      inputGender ? inputGender.value        : '',
    };
    if (window._novynSocket) window._novynSocket.emit('update_profile', payload);
    hideModal();
  });

  // Expose avatar utils for app.js
  window._novynAvatarUtils = { getAvatarById: getAvatarById, applyAvatarToEl: applyAvatarToEl, AVATARS: AVATARS };
})();
