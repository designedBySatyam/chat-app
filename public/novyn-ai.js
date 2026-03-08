/* ═══════════════════════════════════════════════════════════════
   NOVYN AI — Intelligence Layer  v2.0
   Powered by Claude (Anthropic)

   Features
   ─────────
   1. Smart Reply Chips  — 3 AI reply suggestions after each message
   2. ✦ Polish Button    — rewrites your draft in composer
   3. @novyn command     — "@novyn <question>" → AI answers inline
   4. Novyn AI Friend    — full Claude chat in the sidebar

   Server routes needed (add to server.js)
   ─────────────────────────────────────────
   const fetch = require('node-fetch');

   app.post('/api/ai', express.json(), async (req, res) => {
     try {
       const r = await fetch('https://api.anthropic.com/v1/messages', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'x-api-key': process.env.ANTHROPIC_API_KEY,
           'anthropic-version': '2023-06-01'
         },
         body: JSON.stringify(req.body)
       });
       res.json(await r.json());
     } catch(e) { res.status(500).json({ error: e.message }); }
   });

   Add to .env:  ANTHROPIC_API_KEY=sk-ant-...
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const API   = '/api/ai';
  const MODEL = 'claude-sonnet-4-20250514';

  /* ── Utility ─────────────────────────────────────────────── */
  function me() { return window._novynMe ? window._novynMe() : '' }

  async function ai(body) {
    try {
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, max_tokens: 600, ...body })
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      console.warn('[Novyn AI]', e.message);
      return null;
    }
  }

  function text(data) {
    return (data?.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text).join('');
  }

  /* ══════════════════════════════════════════════════════════
     1. SMART REPLY CHIPS
     Observes #messages for new "them" bubbles, generates 3 replies
     ══════════════════════════════════════════════════════════ */
  const bar    = document.getElementById('smartRepliesBar');
  const msgsEl = document.getElementById('messages');
  let srTimer  = null;
  let lastMsgId = null;

  function srLoading() {
    if (!bar) return;
    bar.innerHTML = `
      <span class="sr-lbl">
        <svg viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1.2"/>
          <path d="M5 2.5v2.5l1.5 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        ✦ thinking
      </span>
      <div class="sr-dots"><span></span><span></span><span></span></div>`;
    bar.classList.remove('hidden');
  }

  function srHide() {
    if (!bar) return;
    bar.classList.add('hidden');
    bar.innerHTML = '';
  }

  function getCtx(n = 6) {
    return Array.from(document.querySelectorAll('#messages .msg:not(.search-hidden)'))
      .slice(-n)
      .map(el => `${el.dataset.messageFrom || '?'}: ${el.dataset.messageText || ''}`)
      .join('\n');
  }

  async function genReplies(incoming, ctx) {
    const prompt = `You are a smart-reply assistant for a private chat app.

Given the last message and context, suggest EXACTLY 3 short natural reply options.
Rules:
• Each reply: 2–9 words max
• Mix tones: one enthusiastic, one neutral, one question
• Feel human, not robotic — casual chat language is fine
• Return ONLY a raw JSON array of 3 strings — no markdown, no explanation
• Example: ["Sounds good!", "What time though?", "I'm definitely in 🙌"]

Context (oldest first):
${ctx}

Incoming message: "${incoming}"

JSON:`;

    const data = await ai({ max_tokens: 180, messages: [{ role: 'user', content: prompt }] });
    if (!data) return [];
    try {
      const raw = text(data).trim().replace(/```json|```/g, '').trim();
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.slice(0, 3);
    } catch (_) {
      const m = text(data).match(/"([^"]{3,50})"/g);
      if (m) return m.slice(0, 3).map(s => s.replace(/"/g, ''));
    }
    return [];
  }

  function srRender(replies) {
    if (!bar || !replies.length) { srHide(); return; }
    const chips = replies.map(r =>
      `<button class="sr-chip" type="button">${r}</button>`
    ).join('');
    bar.innerHTML = `
      <span class="sr-lbl">
        <svg viewBox="0 0 10 10" fill="none">
          <path d="M2 5.5l2 2L8.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        ✦ suggest
      </span>${chips}`;
    bar.classList.remove('hidden');

    bar.querySelectorAll('.sr-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = document.getElementById('messageInput');
        if (!inp) return;
        inp.value = btn.textContent;
        inp.focus();
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        srHide();
      });
    });
  }

  // Watch #messages for new incoming messages
  if (msgsEl) {
    new MutationObserver(muts => {
      for (const m of muts) {
        for (const node of m.addedNodes) {
          if (
            node.nodeType !== 1 ||
            !node.classList?.contains('msg') ||
            node.classList.contains('me') ||
            node.classList.contains('ai-msg')
          ) continue;
          const id   = node.dataset.messageId;
          const txt  = node.dataset.messageText || '';
          if (!txt || txt === 'This message was deleted.' || id === lastMsgId) continue;
          lastMsgId = id;
          clearTimeout(srTimer);
          srTimer = setTimeout(async () => {
            srLoading();
            const ctx     = getCtx(6);
            const replies = await genReplies(txt, ctx);
            srRender(replies);
          }, 500);
        }
      }
    }).observe(msgsEl, { childList: true });
  }

  // Hide chips while user types their own message
  const inp = document.getElementById('messageInput');
  if (inp) {
    inp.disabled = false;
    inp.addEventListener('input', () => { if (inp.value.trim()) srHide() });
  }

  /* ══════════════════════════════════════════════════════════
     2. ✦ POLISH BUTTON
     Rewrites the current draft to be cleaner / more natural
     ══════════════════════════════════════════════════════════ */
  const polishBtn = document.getElementById('aiPolishBtn');

  async function polish(draft) {
    const data = await ai({
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Rewrite this chat message to be clearer and more natural. Keep the same intent and casual tone. Return ONLY the rewritten message — no quotes, no explanation.

Original: ${draft}
Rewritten:`
      }]
    });
    return data ? text(data).trim() : null;
  }

  if (polishBtn && inp) {
    polishBtn.addEventListener('click', async () => {
      const draft = inp.value.trim();
      if (!draft) return;
      polishBtn.classList.add('spin');
      polishBtn.disabled = true;
      const result = await polish(draft);
      polishBtn.classList.remove('spin');
      polishBtn.disabled = false;
      if (result) {
        inp.value = result;
        inp.focus();
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.style.transition = 'color .3s';
        inp.style.color = 'var(--vi-300)';
        setTimeout(() => { inp.style.color = '' }, 700);
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     3. @NOVYN COMMAND
     Intercepts sends starting with "@novyn " — gets AI answer
     and sends it as the user's message
     ══════════════════════════════════════════════════════════ */
  const msgForm = document.getElementById('messageForm');
  let inlineCommandBusy = false;

  async function answerCommand(query) {
    const data = await ai({
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are Novyn AI, a helpful assistant in a private chat app.
Answer this question concisely in 1–3 sentences (chat-friendly, not an essay):

${query}`
      }]
    });
    return data ? text(data).trim() : null;
  }

  if (msgForm && inp) {
    msgForm.addEventListener('submit', async e => {
      const val = inp.value.trim();
      if (!val.toLowerCase().startsWith('@novyn ') || window._novynAiChatOpen || inlineCommandBusy) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const query = val.slice(7).trim();
      if (!query) return;
      inlineCommandBusy = true;
      inp.value    = '✦ novyn ai is thinking…';
      let answer = null;
      try {
        answer = await answerCommand(query);
      } catch (_) {
        answer = null;
      }
      inlineCommandBusy = false;
      if (answer) {
        inp.value = answer;
        inp.focus();
        msgForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      } else {
        inp.value = '';
        inp.placeholder = 'AI unavailable — try again';
        setTimeout(() => { inp.placeholder = 'Write something… or @novyn for AI' }, 3000);
      }
    }, true);
  }

  /* ══════════════════════════════════════════════════════════
     4. NOVYN AI FRIEND
     Full Claude conversation — local history, no server storage
     ══════════════════════════════════════════════════════════ */
  const HISTORY = [];

  const SYS = `You are Novyn AI — a friendly, witty assistant embedded in Novyn, a private realtime chat app.
You're like a knowledgeable friend: helpful, warm, direct.
Keep responses short and conversational (this is a chat, not a document).
Use the occasional emoji naturally. Be genuine, not corporate.`;

  async function aiChat(userMsg) {
    HISTORY.push({ role: 'user', content: userMsg });
    const data = await ai({
      max_tokens: 600,
      system: SYS,
      messages: HISTORY.slice(-20)
    });
    if (!data) { HISTORY.pop(); return null; }
    const reply = text(data).trim();
    HISTORY.push({ role: 'assistant', content: reply });
    return reply;
  }

  function renderMsg(txt, isMe) {
    if (!msgsEl) return;
    const ts  = new Date().toISOString();
    const who = isMe ? (me() || 'you') : 'novyn-ai';
    const row = document.createElement('article');
    row.className = `msg ${isMe ? 'me' : 'them ai-msg'} no-anim`;
    row.dataset.messageFrom = who;
    row.dataset.messageText = txt;
    row.dataset.timestamp   = ts;

    const meta = document.createElement('span');
    meta.className = 'msg-meta';
    const t = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    meta.textContent = isMe ? t : `Novyn AI · ${t}`;

    const body = document.createElement('div');
    body.className   = 'msg-body';
    body.textContent = txt;

    row.append(meta, body);
    msgsEl.appendChild(row);
    msgsEl.scrollTo({ top: msgsEl.scrollHeight, behavior: 'smooth' });
  }

  function renderThinking() {
    if (!msgsEl) return null;
    const row = document.createElement('article');
    row.className = 'msg them ai-msg no-anim';
    row.id = 'ai-thinking';
    row.innerHTML = `
      <span class="msg-meta">✦ Novyn AI</span>
      <div class="msg-body">
        <div class="ty-dots" style="padding:2px 0">
          <span></span><span></span><span></span>
        </div>
      </div>`;
    msgsEl.appendChild(row);
    msgsEl.scrollTo({ top: msgsEl.scrollHeight, behavior: 'smooth' });
    return row;
  }

  function setAiComposerEnabled(enabled) {
    if (!msgForm || !inp) return;
    const sendBtn = msgForm.querySelector('.send-btn,[type="submit"]');
    inp.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    inp.placeholder = enabled ? 'Message Novyn AI…' : 'Write something… or @novyn for AI';
  }

  function openAiChat() {
    const layout   = document.getElementById('chatLayout');
    if (!layout || layout.classList.contains('hidden')) return;

    // Update header
    const nameEl = document.getElementById('activeFriendLabel');
    const presEl = document.getElementById('activeFriendPresenceLine');
    const avEl   = document.getElementById('activeFriendAvatar');
    if (nameEl) nameEl.textContent = 'Novyn AI';
    if (presEl) { presEl.textContent = '✦ AI · Always online'; presEl.className = 'ch-pres ai-p' }
    if (avEl)   { avEl.textContent = '✦'; avEl.className = 'ch-av ai-av2' }

    // Clear messages and greet
    if (msgsEl) {
      msgsEl.innerHTML = '';
      renderMsg("Hey! I'm Novyn AI 👋 Ask me anything — questions, help writing a message, ideas, or just chat.", false);
    }

    srHide();
    document.querySelectorAll('.ai-friend').forEach(b => b.classList.add('active'));
    document.querySelectorAll('.friend-row').forEach(b => b.classList.remove('active'));
    document.getElementById('removeFriendBtn').style.display = 'none';
    window._novynAiChatOpen = true;
    setAiComposerEnabled(true);
    inp?.focus();
  }

  // Click AI friend button
  document.addEventListener('click', e => {
    if (!e.target.closest('.ai-friend')) return;
    openAiChat();
    // Mobile: show chat pane
    if (window.innerWidth <= 768) {
      document.getElementById('mobileSidebar')?.setAttribute('data-mob-hidden', '');
      document.getElementById('mobileChat')?.removeAttribute('data-mob-hidden');
    }
  });

  // Intercept form submits when AI chat is open
  if (msgForm && inp) {
    msgForm.addEventListener('submit', async e => {
      if (!window._novynAiChatOpen) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const val = inp.value.trim();
      if (!val) return;
      inp.value = '';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      renderMsg(val, true);
      srHide();
      const thinking = renderThinking();
      const reply    = await aiChat(val);
      thinking?.remove();
      renderMsg(reply || "Sorry, I couldn't connect right now 😅", false);
    }, true);
  }

  // Reset AI flag when real friend selected
  document.addEventListener('click', e => {
    if (e.target.closest('.friend-row')) {
      window._novynAiChatOpen = false;
      document.querySelectorAll('.ai-friend').forEach(b => b.classList.remove('active'));
      inp && (inp.placeholder = 'Write something… or @novyn for AI');
    }
  });

  document.getElementById('mobBackBtn')?.addEventListener('click', () => {
    window._novynAiChatOpen = false;
    document.querySelectorAll('.ai-friend').forEach(b => b.classList.remove('active'));
    const active = window._novynActiveFriend ? String(window._novynActiveFriend() || '').trim() : '';
    if (!active) setAiComposerEnabled(false);
  });

  /* ── Public API ──────────────────────────────────────────── */
  window._novynAI = { openAiChat, aiChat, polish, genReplies, clearHistory: () => HISTORY.splice(0) };

  console.log('[Novyn AI] ✦ loaded');
})();
