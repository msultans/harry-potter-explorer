import "server-only";
import type { ChatMessage } from "./types";

/**
 * Server-only client for Ollama, the single language-model backend of this app.
 *
 * Ollama runs the model itself, so there is no third-party API and no API key:
 * locally it is the `ollama serve` daemon, in production it is the `ollama`
 * container defined in docker-compose.yml. Either way the browser never talks
 * to it — requests go to our own /api/chat route.
 *
 * The native Ollama HTTP API is used (rather than its OpenAI-compatible shim)
 * because it also reports which models are installed, which lets the UI say
 * exactly what is missing instead of failing with a generic error.
 */

const DEFAULT_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_MODEL = "llama3.2:1b";

/** Where Ollama listens. In Docker Compose this is http://ollama:11434. */
export const OLLAMA_BASE_URL: string = (process.env.OLLAMA_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");

/** Model tag to converse with, e.g. "llama3.2:1b" or "qwen2.5:3b". */
export const OLLAMA_MODEL: string = process.env.OLLAMA_MODEL?.trim() || DEFAULT_MODEL;

/** How long Ollama keeps the model in memory after a reply. Avoids reload lag. */
const KEEP_ALIVE: string = process.env.OLLAMA_KEEP_ALIVE?.trim() || "15m";

/** Cap on generated tokens; the persona prompt asks for short replies anyway. */
const NUM_PREDICT = 400;

/** Status probes are cheap but not free — a reply is worth more than a probe. */
const PROBE_TIMEOUT_MS = 4000;
const STATUS_CACHE_MS = 10_000;

/** Ollama failure that already carries an HTTP status, for error mapping. */
export class OllamaError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "OllamaError";
    this.status = status;
  }
}

/* ------------------------------------------------------------------ */
/* Readiness                                                           */
/* ------------------------------------------------------------------ */

export type ChatStatus =
  | { ready: true; model: string; parameterSize: string | null }
  | {
      ready: false;
      /** `unreachable`: no Ollama at OLLAMA_BASE_URL. `model_missing`: it runs but the tag is not pulled. */
      reason: "unreachable" | "model_missing";
      model: string;
      /** Tags Ollama does have, so the UI can suggest one. */
      available: string[];
      detail: string;
    };

interface TagsResponse {
  models?: Array<{ name?: string; details?: { parameter_size?: string } }>;
}

let cachedStatus: { at: number; value: ChatStatus } | null = null;

/**
 * Asks Ollama which models it has. Cached briefly so a page full of widgets
 * cannot turn into a probe storm.
 */
export async function getChatStatus(): Promise<ChatStatus> {
  const now = Date.now();
  if (cachedStatus && now - cachedStatus.at < STATUS_CACHE_MS) return cachedStatus.value;

  let value: ChatStatus;
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      cache: "no-store",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Ollama responded ${res.status}`);

    const body = (await res.json()) as TagsResponse;
    const models = (body.models ?? []).filter((m) => typeof m.name === "string");
    const match = models.find((m) => m.name === OLLAMA_MODEL);

    value = match
      ? { ready: true, model: OLLAMA_MODEL, parameterSize: match.details?.parameter_size ?? null }
      : {
          ready: false,
          reason: "model_missing",
          model: OLLAMA_MODEL,
          available: models.map((m) => m.name as string),
          detail: `Ollama is running but "${OLLAMA_MODEL}" is not pulled yet.`,
        };
  } catch (err) {
    value = {
      ready: false,
      reason: "unreachable",
      model: OLLAMA_MODEL,
      available: [],
      detail: `No Ollama at ${OLLAMA_BASE_URL}: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  cachedStatus = { at: now, value };
  return value;
}

/** Clears the probe cache — used right after a pull so the UI updates at once. */
export function forgetChatStatus(): void {
  cachedStatus = null;
}

/* ------------------------------------------------------------------ */
/* Streaming                                                           */
/* ------------------------------------------------------------------ */

/** The slice of a streaming reply that /api/chat consumes. */
export interface CharacterStream {
  on(event: "text", listener: (textDelta: string, textSnapshot: string) => void): unknown;
  finalMessage(): Promise<{ stop_reason: string | null }>;
  abort(): void;
}

interface ChatChunk {
  message?: { content?: string };
  done?: boolean;
  done_reason?: string;
  error?: string;
}

/** Ollama streams newline-delimited JSON, one object per token. */
async function* readChunks(body: ReadableStream<Uint8Array>): AsyncGenerator<ChatChunk> {
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
        if (!line) continue;
        try {
          yield JSON.parse(line) as ChatChunk;
        } catch {
          /* a partial frame; the next read completes it */
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Opens the reply stream and awaits the response headers, so a missing model or
 * an unreachable daemon surfaces before anything is streamed and can still be
 * mapped to a proper HTTP status.
 */
export async function openCharacterStream(
  systemPrompt: string,
  history: ChatMessage[],
): Promise<CharacterStream> {
  const controller = new AbortController();

  let res: Response;
  try {
    res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      cache: "no-store",
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: true,
        keep_alive: KEEP_ALIVE,
        messages: [{ role: "system", content: systemPrompt }, ...history],
        options: { temperature: 0.8, num_predict: NUM_PREDICT },
      }),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new OllamaError(503, `Cannot reach Ollama at ${OLLAMA_BASE_URL}: ${detail}`);
  }

  if (!res.ok || !res.body) {
    const text = (await res.text().catch(() => "")).slice(0, 300);
    throw new OllamaError(res.status, text || `Ollama responded ${res.status}`);
  }

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
      let reason: string | null = null;
      try {
        for await (const chunk of readChunks(res.body!)) {
          // Ollama can report a mid-stream failure inside the JSON line.
          if (chunk.error) throw new Error(chunk.error);
          const delta = chunk.message?.content;
          if (delta) {
            snapshot += delta;
            onText?.(delta, snapshot);
          }
          if (chunk.done) reason = chunk.done_reason ?? "stop";
        }
      } catch (err) {
        if (!aborted) throw err;
      }
      return { stop_reason: reason };
    },
  };
}
