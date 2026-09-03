import Link from "next/link";
import { HouseColorSwatches, HouseCrest } from "@/components/houses/HouseCrest";
import { HOUSE_STYLES, type House } from "@/lib/houses";
import { cn } from "@/lib/utils";

interface Props {
  house: House;
  className?: string;
}

/**
 * List-page card: crest, founder, animal and element, colours, traits, the
 * house blurb and a stretched "View house" link that makes the whole card clickable.
 */
export function HouseCard({ house, className }: Props) {
  const style = HOUSE_STYLES[house.slug];
  const [primary, secondary] = house.colors;

  return (
    <article className={cn("card card-hover relative flex h-full flex-col overflow-hidden", className)}>
      <div
        aria-hidden
        className="h-1.5 w-full"
        style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}
      />
      <div className="flex flex-1 flex-col gap-5 p-6 sm:p-7">
        <header className="flex items-start gap-5">
          <HouseCrest house={house} size={72} className="drop-shadow-[0_6px_16px_rgba(0,0,0,0.55)]" />
          <div className="min-w-0">
            <p className="eyebrow">Founded by {house.founder}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-gold-200 sm:text-3xl">{house.name}</h2>
            <p className="mt-1 text-sm text-muted">
              <span className={style.text}>{house.animal}</span> · {house.element}
            </p>
          </div>
        </header>

        <HouseColorSwatches house={house} className="text-sm text-muted" />

        <ul aria-label={`${house.name} traits`} className="flex flex-wrap gap-1.5">
          {house.traits.map((trait) => (
            <li key={trait} className={cn("chip", style.badge)}>
              {trait}
            </li>
          ))}
        </ul>

        <p className="text-muted">{house.description}</p>

        <div className="mt-auto pt-1">
          <Link
            href={`/houses/${house.slug}`}
            className="btn-outline after:absolute after:inset-0 after:content-['']"
          >
            View house
            <span className="sr-only">: {house.name}</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
