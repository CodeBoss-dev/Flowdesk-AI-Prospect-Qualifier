import type { ChatMessage } from '../types';
import { GROQ_MODEL, RATE_LIMIT_RETRY_MS } from '../constants';

// PRODUCTION: Move this to a backend proxy. Client-side key is for demo only.
const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

class GroqError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GroqError';
    this.status = status;
  }
}

async function fetchCompletion(
  messages: ChatMessage[],
  signal: AbortSignal,
): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      stream: true,
    }),
    signal,
  });

  if (response.status === 429) {
    throw new GroqError('rate_limit', 429);
  }

  if (!response.ok) {
    throw new GroqError(
      `Groq API error: ${response.status} ${response.statusText}`,
      response.status,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new GroqError('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    // Keep the last potentially incomplete line in the buffer
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;

      try {
        const json = JSON.parse(trimmed.slice(6));
        const content = json.choices?.[0]?.delta?.content;
        if (content) result += content;
      } catch {
        // Skip malformed SSE chunks
      }
    }
  }

  return result;
}

export async function sendMessage(messages: ChatMessage[]): Promise<string> {
  if (!API_KEY) {
    throw new GroqError(
      'Missing API key. Add VITE_GROQ_API_KEY to your .env file.',
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    return await fetchCompletion(messages, controller.signal);
  } catch (error) {
    if (error instanceof GroqError && error.status === 429) {
      // Retry once after delay
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_MS));
      try {
        return await fetchCompletion(messages, controller.signal);
      } catch {
        throw new GroqError(
          "Aria is thinking... give her a moment. Please try again shortly.",
        );
      }
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new GroqError('Request timed out. Please try again.');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
