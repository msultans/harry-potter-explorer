import { CharacterCard } from "@/components/CharacterCard";
import { getCharactersByHouse, HpApiError } from "@/lib/hp-api";
import { HOUSE_BY_SLUG } from "@/lib/houses";
import type { Character, HouseSlug } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  slug: HouseSlug;
}

const GRID = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4";

/** Portraits first, then A→Z, so the grid opens with faces rather than initials. */
function sortMembers(members: Character[]): Character[] {
  return [...members].sort(
    (a, b) => (a.image ? 0 : 1) - (b.image ? 0 : 1) || a.name.localeCompare(b.name),
  );
}

/** Async server component: every known member of a house, fetched via lib/hp-api. */
export async function HouseMembers({ slug }: Props) {
  let members: Character[];
  try {
    members = sortMembers(await getCharactersByHouse(slug));
  } catch (err) {
    if (err instanceof HpApiError) return <MembersUnavailable slug={slug} />;
    throw err;
  }

  if (members.length === 0) {
    return (
      <p className="card mt-6 p-6 text-muted">
        No known members of {HOUSE_BY_SLUG[slug].name} yet — the Sorting Hat is still deliberating.
      </p>
    );
  }

  return (
    <>
      <p className="mt-2 text-muted">
        <span className="font-semibold text-parchment">{members.length}</span> known{" "}
        {members.length === 1 ? "member" : "members"}
      </p>
      <ul className={cn("mt-6", GRID)}>
        {members.map((character, i) => (
          <li key={character.id}>
            <CharacterCard character={character} preload={i < 4} className="h-full" />
          </li>
        ))}
      </ul>
    </>
  );
}

function MembersUnavailable({ slug }: Props) {
  return (
    <div className="card mt-6 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-lg text-gold-200">
          The Harry Potter API is taking a nap — try again in a moment.
        </p>
        <p className="mt-1 text-sm text-muted">
          Members are fetched live from the Harry Potter API, which sometimes needs a moment to wake up.
        </p>
      </div>
      <a href={`/houses/${slug}`} className="btn-outline shrink-0">
        Try again
      </a>
    </div>
  );
}

/** Grid placeholder shown while members load; also reused by the route's loading.tsx. */
export function HouseMembersSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div role="status" className="mt-2">
      <span className="sr-only">Loading members…</span>
      <div aria-hidden className="h-5 w-40 animate-pulse rounded bg-white/10" />
      <ul aria-hidden className={cn("mt-6", GRID)}>
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="card animate-pulse overflow-hidden">
            <div className="aspect-[3/4] w-full bg-white/[0.06]" />
            <div className="space-y-2 p-4">
              <div className="h-5 w-24 rounded-full bg-white/10" />
              <div className="h-4 w-32 rounded bg-white/10" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
