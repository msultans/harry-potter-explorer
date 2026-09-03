import Image from "next/image";
import { houseOf, houseStyle } from "@/lib/houses";
import { cn, initials } from "@/lib/utils";
import type { Character } from "@/lib/types";

interface Props {
  character: Pick<Character, "name" | "house" | "image">;
  className?: string;
}

/**
 * Large hero portrait for the character detail page. Falls back to the
 * character's initials on a house-coloured gradient when no image exists
 * (most of the dataset), matching the catalog cards.
 */
export function Portrait({ character, className }: Props) {
  const house = houseOf(character.house);
  const style = houseStyle(character.house);

  return (
    <figure className={cn("relative", className)}>
      <div
        className={cn(
          "relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-gradient-to-b shadow-glow ring-4 ring-offset-4 ring-offset-night-950",
          style.gradient,
          style.ring,
        )}
      >
        {character.image ? (
          <Image
            src={character.image}
            alt={`Portrait of ${character.name}`}
            fill
            preload
            sizes="(min-width: 1280px) 420px, (min-width: 1024px) 38vw, (min-width: 640px) 384px, 100vw"
            className="object-cover object-top"
          />
        ) : (
          <div
            role="img"
            aria-label={`No portrait available for ${character.name}`}
            className="flex h-full w-full flex-col items-center justify-center gap-3"
          >
            <span
              aria-hidden
              className="font-display text-7xl font-semibold text-white/70 drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] sm:text-8xl"
            >
              {initials(character.name)}
            </span>
            <span aria-hidden className="text-xs uppercase tracking-[0.3em] text-white/50">
              No portrait
            </span>
          </div>
        )}

        {/* Soft vignette so the frame reads as one piece with the night theme. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-950/70 via-transparent to-night-950/20"
        />

        {house && (
          <span
            aria-hidden
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-night-950/70 text-2xl shadow-lg backdrop-blur-sm"
          >
            {house.emblem}
          </span>
        )}
      </div>

      <figcaption className="sr-only">
        {character.name}
        {house ? `, ${house.name}` : ", unsorted"}
      </figcaption>
    </figure>
  );
}
