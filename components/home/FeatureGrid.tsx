import Link from "next/link";
import type { ReactNode } from "react";

/** Six entry points into the app, one card each. */

type IconName = "houses" | "characters" | "spells" | "artifacts" | "favorites" | "live";

interface Feature {
  href: string;
  title: string;
  description: string;
  icon: IconName;
}

const FEATURES: Feature[] = [
  {
    href: "/houses",
    title: "Houses",
    description: "Founders, colours, traits and the students of all four houses.",
    icon: "houses",
  },
  {
    href: "/characters",
    title: "Characters",
    description: "Search hundreds of witches, wizards and magical beings by name or house.",
    icon: "characters",
  },
  {
    href: "/spells",
    title: "Spells",
    description: "Charms, jinxes and curses, and what each incantation does.",
    icon: "spells",
  },
  {
    href: "/artifacts",
    title: "Artifacts",
    description: "Legendary objects, from the Elder Wand to the Marauder's Map.",
    icon: "artifacts",
  },
  {
    href: "/favorites",
    title: "Favorites",
    description: "The characters you have marked with a heart, kept on this device.",
    icon: "favorites",
  },
  {
    href: "/live",
    title: "Live feed",
    description: "See what other explorers are favouriting, as it happens.",
    icon: "live",
  },
];

const ICON_PATHS: Record<IconName, ReactNode> = {
  houses: (
    <>
      <path d="M12 3l7 2.8v5.4c0 4.6-3 8.3-7 9.8-4-1.5-7-5.2-7-9.8V5.8L12 3z" />
      <path d="M12 3v18M5 11.5h14" />
    </>
  ),
  characters: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7" />
    </>
  ),
  spells: (
    <>
      <path d="M11 3l1.9 5.4L18.3 10l-5.4 1.9L11 17.3l-1.9-5.4L3.7 10l5.4-1.6L11 3z" />
      <path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8L19 15z" />
    </>
  ),
  artifacts: (
    <>
      <path d="M7 3h10l4 6-9 12L3 9l4-6z" />
      <path d="M3 9h18M9.5 3L12 9l2.5-6M8 9l4 12 4-12" />
    </>
  ),
  favorites: (
    <path d="M12 21s-7.5-4.6-9.5-9.1C1.1 8.6 3.2 5 6.6 5c2 0 3.3 1.1 4.1 2.3L12 8.6l1.3-1.3C14.1 6.1 15.4 5 17.4 5c3.4 0 5.5 3.6 4.1 6.9C19.5 16.4 12 21 12 21z" />
  ),
  live: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8" />
    </>
  ),
};

function FeatureIcon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

export function FeatureGrid() {
  return (
    <section aria-labelledby="explore-title" className="container-page py-12 sm:py-16">
      <div className="mb-6">
        <p className="eyebrow mb-2">Explore</p>
        <h2 id="explore-title" className="heading-lg">
          Wander the grounds
        </h2>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <li key={feature.href}>
            <Link href={feature.href} className="card card-hover group flex h-full items-start gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold-500/30 bg-gold-500/10 text-gold-300 transition-colors group-hover:bg-gold-500/20 group-hover:text-gold-200">
                <FeatureIcon name={feature.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-semibold text-gold-200">{feature.title}</span>
                <span className="mt-1 block text-sm text-muted">{feature.description}</span>
              </span>
              <span
                aria-hidden
                className="self-center text-gold-600 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-gold-400"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
