/** Skeleton mirroring the two-column shape of the character detail page. */
export default function CharacterLoading() {
  return (
    <div className="container-page py-10 sm:py-14" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading character…</span>

      <div className="h-4 w-28 animate-pulse rounded bg-white/10" />

      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12" aria-hidden>
        <div className="lg:col-span-5">
          <div className="mx-auto aspect-[3/4] w-full max-w-sm animate-pulse rounded-3xl bg-white/[0.06] ring-4 ring-white/10 ring-offset-4 ring-offset-night-950 lg:max-w-none" />
        </div>

        <div className="min-w-0 lg:col-span-7">
          <div className="h-7 w-32 animate-pulse rounded-full bg-white/10" />
          <div className="mt-5 h-12 w-3/4 animate-pulse rounded-lg bg-white/10 sm:h-14" />
          <div className="mt-4 h-5 w-1/2 animate-pulse rounded bg-white/[0.07]" />

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="h-12 w-44 animate-pulse rounded-full bg-white/10" />
            <div className="h-8 w-16 animate-pulse rounded-full bg-white/[0.07]" />
            <div className="h-8 w-20 animate-pulse rounded-full bg-white/[0.07]" />
            <div className="h-8 w-16 animate-pulse rounded-full bg-white/[0.07]" />
          </div>

          <div className="divider">
            <span className="text-sm">✦</span>
          </div>

          <div className="mb-4 h-3 w-32 animate-pulse rounded bg-white/10" />
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="bg-night-900/85 px-5 py-4">
                <div className="h-2.5 w-20 animate-pulse rounded bg-white/10" />
                <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-white/[0.07]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16 sm:mt-20" aria-hidden>
        <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-9 w-72 animate-pulse rounded-lg bg-white/10" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
      </div>
    </div>
  );
}
