import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-only access to the Anthropic client used by /api/chat.
 *
 * The chat feature is optional: when ANTHROPIC_API_KEY is absent the route
 * answers 503 `chat_not_configured` and the widget shows a friendly notice, so
 * the rest of the app keeps working without any LLM credentials.
 */

/** Model used for character chat. Override with ANTHROPIC_MODEL. */
export const CHAT_MODEL: string = process.env.ANTHROPIC_MODEL || "claude-opus-5";

/** True when an API key is present in the server environment. */
export function isChatConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;

/**
 * Memoised SDK client. `new Anthropic()` reads ANTHROPIC_API_KEY from the
 * environment itself; call `isChatConfigured()` first so an unconfigured
 * server never tries to construct a client.
 */
export function getAnthropic(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}
