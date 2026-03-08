const DEFAULT_AI_MODEL = 'claude-sonnet-4-20250514';
const AI_MAX_TOKENS_LIMIT = 4096;
const AI_REQUEST_TIMEOUT_MS = 30000;

function toDisplayName(value) {
  return String(value || '').trim();
}

function sanitizeAiMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) return [];

  return rawMessages
    .map((message) => {
      const role = toDisplayName(message?.role);
      if (role !== 'user' && role !== 'assistant') return null;

      if (typeof message?.content === 'string') {
        const trimmed = message.content.trim();
        if (!trimmed) return null;
        return { role, content: trimmed };
      }

      if (Array.isArray(message?.content)) {
        return { role, content: message.content };
      }

      return null;
    })
    .filter(Boolean)
    .slice(-30);
}

async function proxyAnthropicRequest({
  apiKey,
  model,
  maxTokens,
  messages,
  systemPrompt,
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages,
        ...(systemPrompt ? { system: systemPrompt } : {}),
      }),
      signal: controller.signal,
    });

    const rawText = await upstream.text();
    let payload = {};
    if (rawText) {
      try {
        payload = JSON.parse(rawText);
      } catch (_err) {
        payload = {
          error: 'Invalid JSON response from AI provider.',
          raw: rawText.slice(0, 500),
        };
      }
    }

    return {
      ok: upstream.ok,
      status: upstream.status,
      payload,
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  DEFAULT_AI_MODEL,
  AI_MAX_TOKENS_LIMIT,
  sanitizeAiMessages,
  proxyAnthropicRequest,
};
