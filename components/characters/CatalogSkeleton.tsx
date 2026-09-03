import { cn } from "@/lib/utils";

interface Props {
  /** Number of placeholder cards. */
  count?: number;
  /** Also render placeholders for the search bar, house chips and results line. */
  withControls?: boolean;
  /** Announce "Loading characters…" to assistive tech. Turn off when a parent already has a live region. */
  announce?: boolean;
  className?: string;
}

/** Pulsing placeholders that mirror the catalogue layout while data loads. */
export function CatalogSkeleton({ count = 8, withControls = true, announce = true, className }: Props) {
  return (
    <div className={cn("animate-pulse", className)}>
      {announce && (
        <p role="status" className="sr-only">
          Loading characters…
        </p>
      )}
      {withControls && (
        <div aria-hidden className="mb-6 space-y-4">
          <div className="card flex flex-col gap-4 p-4 sm:p-5">
            <div className="h-11 rounded-xl bg-white/10" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-9 w-28 rounded-full bg-white/10" />
              ))}
            </div>
          </div>
          <div className="h-4 w-56 rounded bg-white/10" />
        </div>
      )}
      <ul aria-hidden className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="card overflow-hidden">
            <div className="aspect-[3/4] w-full bg-white/10" />
            <div className="space-y-3 p-4 pt-3">
              <div className="h-5 w-24 rounded-full bg-white/10" />
              <div className="h-4 w-3/4 rounded bg-white/10" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
