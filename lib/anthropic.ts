import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-only Anthropic client for the character chat.
 *
 * Whether Claude is the active backend at all is decided in lib/llm.ts, which
 * also supports any OpenAI-compatible endpoint (including a local model served
 * by Ollama). Call `getChatProvider()` first; this module only builds the SDK
 * client once the Anthropic provider has been selected.
 */

let client: Anthropic | null = null;

/** Memoised SDK client. `new Anthropic()` reads ANTHROPIC_API_KEY itself. */
export function getAnthropic(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}
