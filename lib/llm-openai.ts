import "server-only";
import { LlmHttpError, type CharacterStream, type ChatMessage, type ChatProvider } from "./llm";

/**
 * Streaming client for any OpenAI-compatible `/chat/completions` endpoint —
 * Ollama and LM Studio locally, Groq / OpenRouter / Together in the cloud.
 *
 * Written with plain `fetch` on purpose: the wire format is a stable, tiny
 * subset of the OpenAI API, and avoiding a second SDK keeps the bundle small.
 */

interface Delta {
  choices?: Array<{ delta?: { content?: string | null }; finish_reason?: string | null }>;
}

/** Reads one SSE `data:` payload per line and yields the text deltas. */
async function* readDeltas(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line.startsWith("data:")) continue;

        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;

        let parsed: Delta;
        try {
          parsed = JSON.parse(payload) as Delta;
        } catch {
          continue; // keep-alive or partial frame; the next chunk completes it
        }
        const text = parsed.choices?.[0]?.delta?.content;
        if (text) yield text;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Opens the upstream stream and awaits the response headers, so authentication,
 * rate-limit and "model not pulled" errors surface before anything is streamed
 * and can still be mapped to a proper HTTP status.
 */
export async function openOpenAiCompatibleStream(
  provider: ChatProvider,
  systemPrompt: string,
  history: ChatMessage[],
  maxTokens: number,
): Promise<CharacterStream> {
  const controller = new AbortController();
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (provider.apiKey) headers.authorization = `Bearer ${provider.apiKey}`;

  let res: Response;
  try {
    res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: provider.model,
        stream: true,
        max_tokens: maxTokens,
        temperature: 0.8,
        messages: [{ role: "system", content: systemPrompt }, ...history],
      }),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new LlmHttpError(502, `Cannot reach the LLM endpoint at ${provider.baseUrl}: ${detail}`);
  }

  if (!res.ok || !res.body) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new LlmHttpError(res.status, detail || `LLM endpoint responded ${res.status}`);
  }

  // Adapter to the CharacterStream shape used by the Anthropic path.
  let onText: ((delta: string, snapshot: string) => void) | null = null;
  let aborted = false;

  return {
    on(event, listener) {
      if (event === "text") onText = listener;
      return this;
    },
    abort() {
      aborted = true;
      controller.abort();
    },
    async finalMessage() {
      let snapshot = "";
      try {
        for await (const delta of readDeltas(res.body!)) {
          snapshot += delta;
          onText?.(delta, snapshot);
        }
      } catch (err) {
        if (!aborted) throw err;
      }
      return { stop_reason: "end_turn" };
    },
  };
}
