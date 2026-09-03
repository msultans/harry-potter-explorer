import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatWidget } from "@/components/ChatWidget";
import { CharacterDetail } from "@/components/character-detail/CharacterDetail";
import { getCharacterById, HpApiError } from "@/lib/hp-api";
import { houseOf } from "@/lib/houses";
import { titleCase } from "@/lib/utils";
import type { Character } from "@/lib/types";

/** Character data changes rarely; regenerate at most once an hour. */
export const revalidate = 3600;

type Props = PageProps<"/characters/[id]">;

function describe(character: Character): string {
  const house = houseOf(character.house);
  const parts = [
    house ? house.name : "Unsorted",
    titleCase(character.species),
    character.hogwartsStudent ? "Hogwarts student" : character.hogwartsStaff ? "Hogwarts staff" : "",
  ].filter(Boolean);
  return `${character.name} — ${parts.join(" · ")}. House, birth date, wand, patronus and more from the Harry Potter Explorer.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  let character: Character | null;
  try {
    character = await getCharacterById(id);
  } catch {
    // Upstream trouble: keep metadata generic and let the page surface error.tsx.
    return { title: "Character" };
  }
  // Unknown id → notFound() here too, so the not-found UI keeps the root
  // metadata instead of a stray "Character" title. (Note: because loading.tsx
  // streams the shell first, the HTTP status is 200 + noindex — see report.)
  if (!character) notFound();

  const description = describe(character);
  return {
    title: character.name,
    description,
    openGraph: {
      title: character.name,
      description,
      type: "profile",
      ...(character.image ? { images: [{ url: character.image, alt: `Portrait of ${character.name}` }] } : {}),
    },
  };
}

export default async function CharacterPage({ params }: Props) {
  const { id } = await params;

  let character: Character | null;
  try {
    character = await getCharacterById(id);
  } catch (err) {
    // Upstream outage must surface app/error.tsx (with its retry), never a 404.
    throw err instanceof HpApiError
      ? new Error(`The Harry Potter API is unavailable right now (${err.message}).`, { cause: err })
      : err;
  }
  if (!character) notFound();

  return (
    <div className="container-page py-10 sm:py-14">
      <Link
        href="/characters"
        className="inline-flex items-center gap-2 text-sm tracking-wide text-parchment-dim transition-colors hover:text-gold-300"
      >
        <span aria-hidden>←</span> All characters
      </Link>

      <div className="mt-8">
        <CharacterDetail character={character} />
      </div>

      <section aria-labelledby="chat-heading" className="mt-16 sm:mt-20">
        <p className="eyebrow mb-3">Ask anything</p>
        <h2 id="chat-heading" className="heading-lg">
          Talk to {character.name}
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Strike up a conversation and hear the wizarding world from {character.name}&rsquo;s point of view.
        </p>
        <div className="mt-6">
          <ChatWidget character={character} />
        </div>
      </section>
    </div>
  );
}
