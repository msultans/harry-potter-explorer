import Link from "next/link";
import { houseOf, houseStyle } from "@/lib/houses";
import { cn } from "@/lib/utils";
import type { LeaderboardRow } from "@/lib/supabase";

/** House badge shared by the live feed and the leaderboard. */
export function HouseChip({ house, className }: { house: string; className?: string }) {
  const info = houseOf(house);
  const style = houseStyle(house);
  return (
    <span className={cn("chip", style.badge, className)}>
      {info ? (
        <>
          <span aria-hidden>{info.emblem}</span> {info.name}
        </>
      ) : (
        "Unsorted"
      )}
    </span>
  );
}

const RANK_CLASS = ["text-gold-300", "text-zinc-300", "text-amber-600"] as const;

interface Props {
  entries: LeaderboardRow[];
  loading?: boolean;
  className?: string;
}

/**
 * Ranked list of the most-favourited characters. Server-compatible (no hooks)
 * so it can be rendered from the client feed or a server page alike.
 */
export function Leaderboard({ entries, loading = false, className }: Props) {
  if (loading) {
    return (
      <ol className={cn("space-y-4", className)} aria-busy aria-label="Loading leaderboard">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-3">
            <span className="h-6 w-6 animate-pulse rounded bg-white/10" />
            <span className="space-y-2">
              <span className="block h-3.5 w-2/3 animate-pulse rounded bg-white/10" />
              <span className="block h-1.5 w-full animate-pulse rounded-full bg-white/5" />
            </span>
            <span className="h-4 w-6 animate-pulse rounded bg-white/10" />
          </li>
        ))}
      </ol>
    );
  }

  if (entries.length === 0) {
    return (
      <p
        className={cn(
          "rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-muted",
          className,
        )}
      >
        No favourites recorded yet. Tap a heart anywhere in the catalogue and the first name
        will appear here.
      </p>
    );
  }

  const top = Math.max(1, ...entries.map((entry) => entry.score));

  return (
    <ol className={cn("space-y-4", className)}>
      {entries.map((entry, index) => {
        const width = Math.max(6, Math.round((entry.score / top) * 100));
        return (
          <li
            key={entry.character_id}
            className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3"
          >
            <span
              className={cn(
                "font-display text-lg font-semibold tabular-nums",
                RANK_CLASS[index] ?? "text-parchment-dim",
              )}
            >
              <span className="sr-only">Rank </span>
              {index + 1}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Link
                  href={`/characters/${entry.character_id}`}
                  className="truncate font-display text-sm font-semibold text-parchment transition-colors hover:text-gold-300"
                >
                  {entry.character_name}
                </Link>
                <HouseChip house={entry.house} />
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-[width] duration-500 ease-out"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-semibold tabular-nums text-gold-300">
              {entry.score}
              <span className="sr-only"> favourites</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
