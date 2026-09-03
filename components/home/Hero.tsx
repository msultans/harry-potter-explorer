import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Landing hero: welcome copy, the two primary calls to action and a purely
 * decorative night-sky layer (radial glow, twinkling stars, floating candles).
 * Server component — nothing here needs interactivity.
 */

interface Ornament {
  /** Absolute positioning + responsive visibility. */
  className: string;
  /** Staggered so the glyphs never move in lockstep. */
  delay: string;
}

const STARS: Array<Ornament & { size: string }> = [
  { className: "left-[7%] top-[16%]", delay: "0s", size: "text-lg" },
  { className: "right-[8%] top-[5%]", delay: "1.3s", size: "text-2xl" },
  { className: "left-[21%] bottom-[22%] hidden sm:block", delay: "2.1s", size: "text-sm" },
  { className: "right-[22%] bottom-[28%] hidden sm:block", delay: "0.7s", size: "text-base" },
  { className: "left-[41%] top-[7%] hidden md:block", delay: "2.8s", size: "text-xs" },
  { className: "right-[35%] top-[9%] hidden lg:block", delay: "1.9s", size: "text-sm" },
];

const CANDLES: Ornament[] = [
  { className: "left-[4%] top-[40%] hidden sm:block", delay: "0s" },
  { className: "right-[5%] top-[36%] hidden sm:block", delay: "2.4s" },
  { className: "left-[13%] top-[62%] hidden lg:block", delay: "4.1s" },
  { className: "right-[14%] top-[66%] hidden lg:block", delay: "1.2s" },
];

function Star({ className, delay, size }: Ornament & { size: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute animate-twinkle text-gold-300 drop-shadow-[0_0_6px_rgba(240,220,154,0.8)]",
        size,
        className,
      )}
      style={{ animationDelay: delay }}
    >
      ✦
    </span>
  );
}

function Candle({ className, delay }: Ornament) {
  return (
    <span aria-hidden className={cn("absolute animate-float", className)} style={{ animationDelay: delay }}>
      <svg width="22" height="46" viewBox="0 0 22 46" fill="none">
        {/* Flame: outer glow twinkles, inner core stays bright */}
        <path
          d="M11 2c3.2 4.2 5.2 6.8 5.2 10.4a5.2 5.2 0 0 1-10.4 0C5.8 8.8 7.8 6.2 11 2z"
          className="animate-twinkle fill-gold-400"
          style={{ animationDelay: delay }}
        />
        <path d="M11 7.5c1.5 2 2.4 3.4 2.4 5.1a2.4 2.4 0 0 1-4.8 0c0-1.7.9-3.1 2.4-5.1z" className="fill-gold-200" />
        {/* Wick and wax */}
        <rect x="10.2" y="17" width="1.6" height="3.5" rx="0.8" className="fill-gold-700" />
        <rect x="5" y="20" width="12" height="24" rx="2.5" className="fill-parchment" />
        <path d="M5 23c2.2 1.2 4 .2 6 1.1s4 .1 6-1.1" stroke="#b9ae94" strokeWidth="1" />
      </svg>
    </span>
  );
}

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* Decorative layer — sits behind the copy and ignores the pointer */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 12%, rgba(211, 166, 37, 0.18), transparent 70%)",
          }}
        />
        {STARS.map((s) => (
          <Star key={s.className} {...s} />
        ))}
        {CANDLES.map((c) => (
          <Candle key={c.className} {...c} />
        ))}
      </div>

      <div className="container-page flex flex-col items-center pt-20 pb-8 text-center sm:pt-28 sm:pb-10">
        <p className="eyebrow animate-fade-up">Welcome to the wizarding world</p>

        <h1
          id="hero-title"
          className="heading-xl mt-4 max-w-4xl animate-fade-up text-balance"
          style={{ animationDelay: "0.1s" }}
        >
          Explore the magic of <span className="text-gold-400">Hogwarts</span>
        </h1>

        <p
          className="mt-6 max-w-2xl animate-fade-up text-lg text-muted text-pretty sm:text-xl"
          style={{ animationDelay: "0.2s" }}
        >
          Step through the castle gates and wander corridors lit by floating candles. Meet the
          witches and wizards who shaped the story, learn the spells they cast, and discover the
          house where you truly belong.
        </p>

        <div
          className="mt-10 flex w-full flex-col items-stretch gap-3 animate-fade-up sm:w-auto sm:flex-row"
          style={{ animationDelay: "0.3s" }}
        >
          <Link href="/characters" className="btn-gold">
            Browse characters
          </Link>
          <Link href="/houses" className="btn-outline">
            Discover the houses
          </Link>
        </div>

        <div aria-hidden className="divider w-full max-w-md">
          <span>✦</span>
        </div>
      </div>
    </section>
  );
}
