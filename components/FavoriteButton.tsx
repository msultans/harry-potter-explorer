"use client";

import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";
import type { Character, FavoriteEntry } from "@/lib/types";

interface Props {
  character: Character | FavoriteEntry;
  size?: "sm" | "md" | "lg";
  /** Show a text label next to the heart. */
  withLabel?: boolean;
  className?: string;
}

/**
 * Heart toggle backed by localStorage (see lib/favorites.ts). Safe to place
 * inside a <Link>: it stops propagation so clicking it never navigates.
 */
export function FavoriteButton({ character, size = "md", withLabel = false, className }: Props) {
  const { isFavorite, toggle, hydrated } = useFavorites();
  const active = hydrated && isFavorite(character.id);
  const dims = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${character.name} from favorites` : `Add ${character.name} to favorites`}
      title={active ? "Remove from favorites" : "Add to favorites"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(character);
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border transition-all duration-200",
        withLabel ? "px-4 py-2" : dims,
        active
          ? "border-gold-500/70 bg-gold-500/20 text-gold-300 shadow-glow"
          : "border-white/15 bg-night-900/70 text-parchment-dim hover:border-gold-500/50 hover:text-gold-300",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        width={size === "sm" ? 16 : 20}
        height={size === "sm" ? 16 : 20}
        aria-hidden
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        className={cn("transition-transform", active && "scale-110")}
      >
        <path d="M12 21s-7.5-4.6-9.5-9.1C1.1 8.6 3.2 5 6.6 5c2 0 3.3 1.1 4.1 2.3L12 8.6l1.3-1.3C14.1 6.1 15.4 5 17.4 5c3.4 0 5.5 3.6 4.1 6.9C19.5 16.4 12 21 12 21z" />
      </svg>
      {withLabel && <span className="text-sm font-semibold">{active ? "In favorites" : "Add to favorites"}</span>}
    </button>
  );
}
