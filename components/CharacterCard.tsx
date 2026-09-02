import Image from "next/image";
import Link from "next/link";
import { FavoriteButton } from "@/components/FavoriteButton";
import { houseOf, houseStyle } from "@/lib/houses";
import { cn, initials } from "@/lib/utils";
import type { Character, FavoriteEntry } from "@/lib/types";

/** The minimal shape a card needs — both Character and FavoriteEntry satisfy it. */
export type CharacterCardData = Pick<Character, "id" | "name" | "house" | "image" | "patronus">;

interface Props {
  character: CharacterCardData | Character | FavoriteEntry;
  /** Pass true for the first few cards in a grid so their portraits are preloaded. */
  preload?: boolean;
  className?: string;
}

/**
 * Portrait card used by the catalog, house pages and favorites.
 * Server-compatible (no hooks); the heart is its own client island.
 */
export function CharacterCard({ character, preload = false, className }: Props) {
  const house = houseOf(character.house);
  const style = houseStyle(character.house);
  const entry: FavoriteEntry = {
    id: character.id,
    name: character.name,
    house: character.house,
    image: character.image,
    patronus: character.patronus,
    addedAt: "addedAt" in character ? character.addedAt : 0,
  };

  return (
    <article className={cn("card card-hover group relative overflow-hidden", className)}>
      <Link href={`/characters/${character.id}`} className="block" aria-label={`${character.name} — details`}>
        <div className={cn("relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-b", style.gradient)}>
          {character.image ? (
            <Image
              src={character.image}
              alt={`Portrait of ${character.name}`}
              fill
              sizes="(min-width: 1024px) 220px, (min-width: 640px) 33vw, 50vw"
              preload={preload}
              className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2">
              <span
                aria-hidden
                className="font-display text-5xl font-semibold text-white/70 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
              >
                {initials(character.name)}
              </span>
              <span className="text-xs uppercase tracking-[0.25em] text-white/50">No portrait</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-night-950/95 via-night-950/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="font-display text-lg font-semibold leading-tight text-gold-200 drop-shadow">
              {character.name}
            </h3>
          </div>
        </div>
        <div className="space-y-2 p-4 pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className={cn("chip", style.badge)}>
              {house ? (
                <>
                  <span aria-hidden>{house.emblem}</span> {house.name}
                </>
              ) : (
                "Unsorted"
              )}
            </span>
          </div>
          <p className="text-sm text-muted">
            <span className="text-gold-500">Patronus:</span>{" "}
            {character.patronus ? (
              <span className="capitalize text-parchment">{character.patronus}</span>
            ) : (
              <span className="italic">unknown</span>
            )}
          </p>
        </div>
      </Link>
      <FavoriteButton character={entry} size="sm" className="absolute right-3 top-3 z-10" />
    </article>
  );
}
