"use client";

import type { Character } from "@/lib/types";

/**
 * PLACEHOLDER — replaced by the chat feature (streams from /api/chat).
 * Keep this prop contract: the character detail page renders <ChatWidget character={character} />.
 */
export function ChatWidget({ character }: { character: Character }) {
  return (
    <section aria-label={`Chat with ${character.name}`} className="card p-6 text-muted">
      Chat with {character.name} is coming soon.
    </section>
  );
}
