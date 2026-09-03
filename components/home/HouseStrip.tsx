import Link from "next/link";
import { HOUSES, houseStyle } from "@/lib/houses";
import { cn } from "@/lib/utils";

/** Four compact house tiles in each house's own colours, linking to /houses/[slug]. */
export function HouseStrip() {
  return (
    <section aria-labelledby="houses-title" className="container-page py-12 sm:py-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="eyebrow mb-2">The four houses</p>
          <h2 id="houses-title" className="heading-lg">
            Where would the Sorting Hat put you?
          </h2>
        </div>
        <Link href="/houses" className="btn-ghost -ml-3 sm:ml-0 sm:-mr-3">
          All houses <span aria-hidden>→</span>
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {HOUSES.map((house) => {
          const style = houseStyle(house.name);
          return (
            <li key={house.slug}>
              <Link
                href={`/houses/${house.slug}`}
                className={cn(
                  "card card-hover group relative flex h-full flex-col gap-3 overflow-hidden bg-linear-to-br p-5 sm:p-6",
                  style.gradient,
                )}
              >
                <span
                  aria-hidden
                  className="origin-left text-4xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-110 sm:text-5xl"
                >
                  {house.emblem}
                </span>
                <span className="flex flex-col">
                  <span className="font-display text-xl font-semibold text-white sm:text-2xl">{house.name}</span>
                  <span className={cn("mt-1 text-xs uppercase tracking-[0.2em]", style.text)}>
                    {house.colorNames}
                  </span>
                </span>
                {/* Signature colour bar in the house's true hex colours */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-1"
                  style={{ background: `linear-gradient(90deg, ${house.colors[0]}, ${house.colors[1]})` }}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
