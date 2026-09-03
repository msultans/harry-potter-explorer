import Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "@/lib/anthropic";
import { buildCharacterSystemPrompt } from "@/lib/chat-prompt";
import { getCharacterById } from "@/lib/hp-api";
import { getChatProvider, LlmHttpError, type CharacterStream, type ChatProvider } from "@/lib/llm";
import { openOpenAiCompatibleStream } from "@/lib/llm-openai";
import type { ChatMessage } from "@/lib/types";

/**
 * POST /api/chat — streams an in-character reply as plain text.
 * GET  /api/chat — reports whether the feature is configured on this server.
 *
 * The reply comes from whichever backend lib/llm.ts selects: Claude through the
 * Anthropic SDK, or any OpenAI-compatible endpoint — a local model served by
 * Ollama / LM Studio, or a hosted gateway such as Groq or OpenRouter. Either
 * way the model is called from the server only.
 *
 * Body: { characterId: string, messages: ChatMessage[] } (≤ 20 messages, each
 * 1–2000 chars, roles user/assistant, last one from the user).
 */

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 2000;
const MAX_TOKENS = 1024;
const REFUSAL_LINE = "I'd rather not speak of that — ask me something else about Hogwarts.";
const LOST_CONNECTION_LINE = "\n\n[The connection to the owl post was lost.]";

const NO_STORE = { "Cache-Control": "no-store" } as const;

function errorJson(status: number, error: string, message: string): Response {
  return Response.json({ error, message }, { status, headers: NO_STORE });
}

export async function GET(): Promise<Response> {
  const provider = getChatProvider();
  return Response.json(
    { configured: provider !== null, provider: provider?.label ?? null },
    { headers: NO_STORE },
  );
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

interface ChatRequest {
  characterId: string;
  messages: ChatMessage[];
}

type Parsed = { ok: true; value: ChatRequest } | { ok: false; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseChatRequest(raw: unknown): Parsed {
  if (!isRecord(raw)) return { ok: false, message: "Request body must be a JSON object." };

  const { characterId, messages } = raw;
  if (typeof characterId !== "string" || !characterId.trim() || characterId.length > 128) {
    return { ok: false, message: "`characterId` must be a non-empty string." };
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, message: "`messages` must be a non-empty array." };
  }
  if (messages.length > MAX_MESSAGES) {
    return { ok: false, message: `A conversation may hold at most ${MAX_MESSAGES} messages.` };
  }

  const parsed: ChatMessage[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m: unknown = messages[i];
    if (!isRecord(m)) return { ok: false, message: `messages[${i}] must be an object.` };
    const { role, content } = m;
    if (role !== "user" && role !== "assistant") {
      return { ok: false, message: `messages[${i}].role must be "user" or "assistant".` };
    }
    if (typeof content !== "string" || content.trim().length === 0) {
      return { ok: false, message: `messages[${i}].content must be a non-empty string.` };
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return { ok: false, message: `messages[${i}].content must be at most ${MAX_CONTENT_LENGTH} characters.` };
    }
    parsed.push({ role, content });
  }

  if (parsed[0]?.role !== "user") return { ok: false, message: "The first message must come from the user." };
  if (parsed[parsed.length - 1]?.role !== "user") {
    return { ok: false, message: "The last message must come from the user." };
  }

  return { ok: true, value: { characterId: characterId.trim(), messages: parsed } };
}

/* ------------------------------------------------------------------ */
/* Streaming                                                           */
/* ------------------------------------------------------------------ */

/**
 * Opens an Anthropic stream and waits for the HTTP response so auth / rate
 * limit / API errors can still be mapped to a proper status code. Uses the
 * server-side refusal fallback (beta) first; if the configured model rejects
 * that parameter with a 400, retries once with the plain Messages API.
 */
async function openAnthropicStream(
  client: Anthropic,
  model: string,
  systemPrompt: string,
  history: ChatMessage[],
) {
  const messages = history.map(({ role, content }): Anthropic.MessageParam => ({ role, content }));
  const params = {
    model,
    max_tokens: MAX_TOKENS,
    system: [{ type: "text" as const, text: systemPrompt, cache_control: { type: "ephemeral" as const } }],
    messages,
    output_config: { effort: "low" as const },
  };

  const withFallback = client.beta.messages.stream({
    ...params,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  try {
    await withFallback.withResponse();
    return withFallback as CharacterStream;
  } catch (err) {
    if (!(err instanceof Anthropic.BadRequestError)) throw err;
    console.error("[api/chat] refusal fallback rejected, retrying without it:", err.message);
  }

  const plain = client.messages.stream(params);
  await plain.withResponse();
  return plain as CharacterStream;
}

function pipeToResponse(stream: CharacterStream, requestSignal: AbortSignal): Response {
  const encoder = new TextEncoder();
  let open = true;
  let cancelled = false;
  let wroteText = false;

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const push = (text: string) => {
        if (!open || !text) return;
        try {
          controller.enqueue(encoder.encode(text));
          wroteText = true;
        } catch {
          open = false;
        }
      };
      const close = () => {
        if (!open) return;
        open = false;
        try {
          controller.close();
        } catch {
          /* already closed by the consumer */
        }
      };

      const onAbort = () => {
        cancelled = true;
        stream.abort();
      };
      requestSignal.addEventListener("abort", onAbort, { once: true });

      stream.on("text", push);
      stream.finalMessage().then(
        (final) => {
          if (final.stop_reason === "refusal") push((wroteText ? "\n\n" : "") + REFUSAL_LINE);
          requestSignal.removeEventListener("abort", onAbort);
          close();
        },
        (err: unknown) => {
          requestSignal.removeEventListener("abort", onAbort);
          if (!cancelled) {
            console.error("[api/chat] stream interrupted:", err instanceof Error ? err.message : err);
            push(LOST_CONNECTION_LINE);
          }
          close();
        },
      );
    },
    cancel() {
      cancelled = true;
      open = false;
      stream.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

/** Opens a stream on whichever backend is configured. */
function openCharacterStream(
  provider: ChatProvider,
  systemPrompt: string,
  history: ChatMessage[],
): Promise<CharacterStream> {
  if (provider.kind === "openai-compatible") {
    return openOpenAiCompatibleStream(provider, systemPrompt, history, MAX_TOKENS);
  }
  return openAnthropicStream(getAnthropic(), provider.model, systemPrompt, history);
}

/** Maps upstream errors raised before any bytes were streamed to HTTP responses. */
function mapUpstreamError(err: unknown): Response {
  if (err instanceof LlmHttpError) {
    if (err.status === 401 || err.status === 403) {
      console.error("[api/chat] LLM endpoint rejected the server credentials:", err.status, err.message);
      return errorJson(503, "chat_misconfigured", "The server's LLM credentials were rejected. Check LLM_API_KEY.");
    }
    if (err.status === 429) {
      return errorJson(429, "rate_limited", "Too many owls at once — try again in a moment.");
    }
    if (err.status === 404) {
      console.error("[api/chat] model missing on the LLM endpoint:", err.message);
      return errorJson(
        503,
        "chat_misconfigured",
        "The configured model is not available on the LLM endpoint. Check LLM_MODEL (with Ollama, run `ollama pull <model>`).",
      );
    }
    console.error("[api/chat] LLM endpoint error:", err.status, err.message);
    return errorJson(502, "upstream_error", "The owl post could not reach the model. Please try again.");
  }
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    console.error("[api/chat] Anthropic rejected the server credentials:", err.status, err.message);
    return errorJson(503, "chat_misconfigured", "The server's Anthropic API key was rejected. Check ANTHROPIC_API_KEY.");
  }
  if (err instanceof Anthropic.RateLimitError) {
    console.error("[api/chat] rate limited by Anthropic:", err.message);
    return errorJson(429, "rate_limited", "Too many owls at once — try again in a moment.");
  }
  if (err instanceof Anthropic.APIError) {
    console.error("[api/chat] Anthropic API error:", err.status, err.message);
    return errorJson(502, "upstream_error", "The owl post could not reach Claude. Please try again.");
  }
  console.error("[api/chat] unexpected error:", err instanceof Error ? err.message : err);
  return errorJson(500, "internal_error", "Something went wrong while summoning a reply.");
}

/* ------------------------------------------------------------------ */
/* Handler                                                             */
/* ------------------------------------------------------------------ */

export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorJson(400, "invalid_json", "Request body must be valid JSON.");
  }

  const parsed = parseChatRequest(raw);
  if (!parsed.ok) return errorJson(400, "invalid_request", parsed.message);
  const { characterId, messages } = parsed.value;

  let character;
  try {
    character = await getCharacterById(characterId);
  } catch (err) {
    console.error("[api/chat] character lookup failed:", err instanceof Error ? err.message : err);
    return errorJson(502, "upstream_unavailable", "The character archive is unreachable right now.");
  }
  if (!character) return errorJson(404, "character_not_found", "No character with that id exists.");

  const provider = getChatProvider();
  if (!provider) {
    return errorJson(
      503,
      "chat_not_configured",
      "Chat is disabled: set ANTHROPIC_API_KEY, or point LLM_BASE_URL at an OpenAI-compatible server (a local Ollama works).",
    );
  }

  let stream: CharacterStream;
  try {
    stream = await openCharacterStream(provider, buildCharacterSystemPrompt(character), messages);
  } catch (err) {
    return mapUpstreamError(err);
  }

  return pipeToResponse(stream, request.signal);
}
