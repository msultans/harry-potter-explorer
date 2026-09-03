import type { ReactNode } from "react";
import { getStats, HpApiError } from "@/lib/hp-api";

/**
 * "The wizarding world in numbers" band under the hero.
 *
 * The page wraps <Stats/> in <Suspense fallback={<StatsSkeleton/>}> so a slow
 * upstream never delays the hero. An upstream failure degrades to a quiet
 * one-liner instead of tripping the error boundary.
 */

interface StatItem {
  label: string;
  value: number;
}

const GRID =
  "grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)] lg:grid-cols-4";
const CELL = "flex flex-col-reverse items-center justify-center gap-1 bg-night-900/90 px-4 py-6 text-center sm:py-8";

function StatsBand({ children }: { children: ReactNode }) {
  return (
    <section aria-labelledby="stats-title" className="container-page pb-6 sm:pb-8">
      <h2 id="stats-title" className="sr-only">
        The wizarding world in numbers
      </h2>
      {children}
    </section>
  );
}

export function StatsSkeleton() {
  return (
    <StatsBand>
      <div role="status" aria-live="polite" className={GRID}>
        <span className="sr-only">Counting the witches and wizards…</span>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} aria-hidden className={CELL}>
            <span className="h-3.5 w-28 animate-pulse rounded bg-white/10" />
            <span className="h-9 w-16 animate-pulse rounded-md bg-white/10 sm:h-10" />
          </div>
        ))}
      </div>
    </StatsBand>
  );
}

function StatsUnavailable() {
  return (
    <StatsBand>
      <p className="text-center text-sm italic text-muted">
        The Ministry archives are sealed for the moment — the figures will return shortly.
      </p>
    </StatsBand>
  );
}

export async function Stats() {
  let stats: Awaited<ReturnType<typeof getStats>>;
  try {
    stats = await getStats();
  } catch (err) {
    if (err instanceof HpApiError) return <StatsUnavailable />;
    throw err;
  }

  const items: StatItem[] = [
    { label: "Characters", value: stats.characters },
    { label: "Hogwarts students", value: stats.students },
    { label: "Hogwarts staff", value: stats.staff },
    { label: "Spells", value: stats.spells },
  ];

  return (
    <StatsBand>
      <dl className={GRID}>
        {items.map((item) => (
          <div key={item.label} className={CELL}>
            <dt className="text-sm tracking-wide text-muted">{item.label}</dt>
            <dd className="font-display text-3xl font-semibold text-gold-200 sm:text-4xl">
              {item.value.toLocaleString("en-US")}
            </dd>
          </div>
        ))}
      </dl>
    </StatsBand>
  );
}
