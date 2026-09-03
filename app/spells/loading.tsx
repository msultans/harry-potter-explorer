/** Skeleton shown while the spell list streams in. Mirrors the page layout so nothing jumps. */
export default function SpellsLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading spells">
      <span className="sr-only">Loading spells…</span>

      <div aria-hidden className="container-page pt-12 pb-8 sm:pt-16">
        <div className="h-3 w-44 animate-pulse rounded bg-gold-500/20" />
        <div className="mt-5 h-12 w-72 max-w-full animate-pulse rounded-lg bg-white/10 sm:h-14" />
        <div className="mt-5 h-5 w-full max-w-2xl animate-pulse rounded bg-white/5" />
        <div className="mt-2 h-5 w-2/3 max-w-xl animate-pulse rounded bg-white/5" />
      </div>

      <div aria-hidden className="container-page pb-20">
        <div className="card p-4 sm:p-5">
          <div className="h-3 w-28 animate-pulse rounded bg-gold-500/20" />
          <div className="mt-3 h-11 w-full animate-pulse rounded-xl bg-night-900/80" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="h-4 w-36 animate-pulse rounded bg-white/5" />
            <div className="hidden gap-1 sm:flex">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="h-7 w-7 animate-pulse rounded-md bg-white/5" />
              ))}
            </div>
          </div>
        </div>

        {Array.from({ length: 3 }, (_, g) => (
          <div key={g} className="mt-10">
            <div className="flex items-baseline gap-3 border-b border-white/10 pb-3">
              <div className="h-8 w-8 animate-pulse rounded bg-gold-500/20" />
              <div className="h-4 w-16 animate-pulse rounded bg-white/5" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="card p-4">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-gold-500/15" />
                  <div className="mt-3 h-4 w-full animate-pulse rounded bg-white/5" />
                  <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-white/5" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
