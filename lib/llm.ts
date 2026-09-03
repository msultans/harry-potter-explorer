import "server-only";
import type { ChatMessage } from "./types";

/**
 * Provider-independent configuration for the character chat.
 *
 * Two backends are supported, both called strictly from the server:
 *
 *  1. `anthropic`         — the official Anthropic SDK (Claude).
 *  2. `openai-compatible` — any server that speaks the OpenAI
 *     `/chat/completions` API: a LOCAL model through Ollama or LM Studio, or a
 *     hosted gateway such as Groq, OpenRouter or Together.
 *
 * Detection order (first match wins):
 *   LLM_BASE_URL set      → openai-compatible
 *   ANTHROPIC_API_KEY set → anthropic
 *   neither               → chat disabled, the widget shows a setup notice
 *
 * Running a local model needs no API key at all, which is why the local option
 * is the recommended way to try the feature without paying a provider.
 */

export type ProviderKind = "anthropic" | "openai-compatible";

export interface ChatProvider {
  kind: ProviderKind;
  model: string;
  /** Shown in the UI so a visitor knows which brain is answering. */
  label: string;
  /** Only for `openai-compatible`. */
  baseUrl?: string;
  apiKey?: string;
}

const DEFAULT_ANTHROPIC_MODEL = "claude-opus-5";
const DEFAULT_LOCAL_MODEL = "llama3.2:1b";

/** Friendly name for the "powered by" caption, derived from the endpoint host. */
function labelForBaseUrl(baseUrl: string, model: string): string {
  let host = "";
  try {
    host = new URL(baseUrl).hostname.toLowerCase();
  } catch {
    host = "";
  }
  if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "host.docker.internal") {
    return `${model} (local)`;
  }
  if (host.includes("groq")) return `${model} on Groq`;
  if (host.includes("openrouter")) return `${model} on OpenRouter`;
  if (host.includes("together")) return `${model} on Together`;
  if (host.includes("openai")) return `${model} on OpenAI`;
  return host ? `${model} on ${host}` : model;
}

/** Resolves the active provider from the environment, or null when chat is off. */
export function getChatProvider(): ChatProvider | null {
  const baseUrl = process.env.LLM_BASE_URL?.trim().replace(/\/+$/, "");
  if (baseUrl) {
    const model = process.env.LLM_MODEL?.trim() || DEFAULT_LOCAL_MODEL;
    return {
      kind: "openai-compatible",
      model,
      label: labelForBaseUrl(baseUrl, model),
      baseUrl,
      // Local servers accept any placeholder; hosted gateways need a real key.
      apiKey: process.env.LLM_API_KEY?.trim() || "not-needed",
    };
  }

  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;
    return { kind: "anthropic", model, label: `${model} by Anthropic` };
  }

  return null;
}

export function isChatConfigured(): boolean {
  return getChatProvider() !== null;
}

/**
 * The slice of the Anthropic SDK's MessageStream that /api/chat consumes. The
 * OpenAI-compatible backend implements the same shape, so one piping routine
 * serves both providers.
 */
export interface CharacterStream {
  on(event: "text", listener: (textDelta: string, textSnapshot: string) => void): unknown;
  finalMessage(): Promise<{ stop_reason: string | null }>;
  abort(): void;
}

/** Upstream failure that already carries an HTTP status, for error mapping. */
export class LlmHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "LlmHttpError";
    this.status = status;
  }
}

export type { ChatMessage };
