const API_URL = '/api/ai';
const MODEL = 'claude-sonnet-4-20250514';

function safeString(value) {
  return String(value || '').trim();
}

function extractText(payload) {
  if (!payload) return '';

  if (typeof payload === 'string') {
    return payload;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content
      .filter((block) => block && block.type === 'text')
      .map((block) => String(block.text || ''))
      .join(' ')
      .trim();
  }

  if (typeof payload?.content === 'string') {
    return payload.content.trim();
  }

  if (typeof payload?.text === 'string') {
    return payload.text.trim();
  }

  return '';
}

async function requestAi({ messages, system, maxTokens = 360 }) {
  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    messages,
    ...(system ? { system } : {}),
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = safeString(payload?.error || payload?.message) || `AI request failed (${response.status})`;
    throw new Error(message);
  }

  return extractText(payload);
}

function fallbackReplies(incomingText) {
  const text = safeString(incomingText).toLowerCase();

  if (!text) {
    return ['Sounds good.', 'Tell me more.', 'What do you think?'];
  }

  if (text.includes('?')) {
    return ['Good question.', 'I will check and reply.', 'What do you think?'];
  }

  if (text.includes('thanks') || text.includes('thank you')) {
    return ['Anytime.', 'Happy to help.', 'You are welcome.'];
  }

  if (text.includes('tonight') || text.includes('tomorrow')) {
    return ['I am in.', 'What time works best?', 'Sounds like a plan.'];
  }

  return ['Sounds good to me.', 'Can you share more details?', 'I can do that.'];
}

export async function buildSmartReplies({ incomingText, contextLines = [] }) {
  const incoming = safeString(incomingText);
  const context = Array.isArray(contextLines) ? contextLines.slice(-6).join('\n') : '';

  if (!incoming) return fallbackReplies('');

  const prompt = [
    'You are a smart-reply assistant for a chat app.',
    'Return ONLY a JSON array of exactly 3 short replies.',
    'Rules:',
    '- 2 to 9 words each',
    '- one enthusiastic, one neutral, one question',
    '- casual human style',
    '',
    `Context:\n${context || '(none)'}`,
    `Incoming: "${incoming}"`,
    '',
    'JSON:',
  ].join('\n');

  try {
    const raw = await requestAi({
      maxTokens: 180,
      messages: [{ role: 'user', content: prompt }],
    });

    const cleaned = raw.replace(/```json|```/gi, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      return fallbackReplies(incoming);
    }

    const replies = parsed
      .map((item) => safeString(item))
      .filter(Boolean)
      .slice(0, 3);

    return replies.length ? replies : fallbackReplies(incoming);
  } catch (_err) {
    return fallbackReplies(incoming);
  }
}

export async function polishDraft(text) {
  const draft = safeString(text);
  if (!draft) return '';

  const prompt = [
    'Rewrite this chat message to be cleaner and natural.',
    'Keep meaning and tone. Return only rewritten text.',
    '',
    `Original: ${draft}`,
    'Rewritten:',
  ].join('\n');

  try {
    const rewritten = safeString(
      await requestAi({
        maxTokens: 140,
        messages: [{ role: 'user', content: prompt }],
      })
    );

    if (rewritten) return rewritten;
  } catch (_err) {
    // Fall through to local fallback.
  }

  return draft
    .replace(/\s+/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
}

export async function answerInline(query) {
  const text = safeString(query);
  if (!text) return '';

  const prompt = [
    'You are Novyn AI in a private chat.',
    'Answer in 1-3 short sentences.',
    `Question: ${text}`,
  ].join('\n');

  try {
    const answer = safeString(
      await requestAi({
        maxTokens: 220,
        messages: [{ role: 'user', content: prompt }],
      })
    );

    return answer || '';
  } catch (_err) {
    return '';
  }
}

export function createAiConversation() {
  const history = [];

  async function send(userText) {
    const text = safeString(userText);
    if (!text) return '';

    history.push({ role: 'user', content: text });

    const systemPrompt = [
      'You are Novyn AI, friendly and concise.',
      'Keep responses useful, chatty, and short.',
    ].join(' ');

    try {
      const reply = safeString(
        await requestAi({
          system: systemPrompt,
          maxTokens: 420,
          messages: history.slice(-20),
        })
      );

      const safeReply = reply || 'I am here. Ask anything.';
      history.push({ role: 'assistant', content: safeReply });
      return safeReply;
    } catch (_err) {
      history.push({ role: 'assistant', content: 'Sorry, I could not connect right now.' });
      return 'Sorry, I could not connect right now.';
    }
  }

  function getHistory() {
    return [...history];
  }

  function clear() {
    history.splice(0, history.length);
  }

  return {
    send,
    getHistory,
    clear,
  };
}
