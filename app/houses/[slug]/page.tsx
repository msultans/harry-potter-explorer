import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { HouseColorSwatches, HouseCrest } from "@/components/houses/HouseCrest";
import { HouseMembers, HouseMembersSkeleton } from "@/components/houses/HouseMembers";
import { HOUSES, HOUSE_BY_SLUG, HOUSE_STYLES, isHouseSlug, type House } from "@/lib/houses";
import { cn } from "@/lib/utils";

export const revalidate = 3600;
/** The four houses are a closed set: unknown slugs 404 at the router, before loading.tsx starts streaming a 200. */
export const dynamicParams = false;

export function generateStaticParams() {
  return HOUSES.map((house) => ({ slug: house.slug }));
}

export async function generateMetadata({ params }: PageProps<"/houses/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!isHouseSlug(slug)) return { title: "House not found" };
  const house = HOUSE_BY_SLUG[slug];
  return {
    title: house.name,
    description: `${house.name} — "${house.motto}". Founder, colours, ghost, common room and every known member.`,
  };
}

export default async function HousePage({ params }: PageProps<"/houses/[slug]">) {
  const { slug } = await params;
  if (!isHouseSlug(slug)) notFound();
  const house = HOUSE_BY_SLUG[slug];
  const style = HOUSE_STYLES[slug];

  return (
    <>
      <HouseHero house={house} />

      <section aria-labelledby="facts-heading" className="container-page py-12">
        <h2 id="facts-heading" className="heading-lg">
          House facts
        </h2>
        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Founder">{house.founder}</Fact>
          <Fact label="Animal">
            <span aria-hidden>{house.emblem}</span> {house.animal}
          </Fact>
          <Fact label="Element">{house.element}</Fact>
          <Fact label="Colours">
            <HouseColorSwatches house={house} />
          </Fact>
          <Fact label="Ghost">{house.ghost}</Fact>
          <Fact label="Head of House">{house.headOfHouse}</Fact>
          <Fact label="Common room">{house.commonRoom}</Fact>
          <Fact label="Traits">
            <ul className="flex flex-wrap gap-1.5">
              {house.traits.map((trait) => (
                <li key={trait} className={cn("chip", style.badge)}>
                  {trait}
                </li>
              ))}
            </ul>
          </Fact>
        </dl>
      </section>

      <section aria-labelledby="members-heading" className="container-page pb-16">
        <div className="divider" aria-hidden>
          <span>✦</span>
        </div>
        <h2 id="members-heading" className="heading-lg">
          Members
        </h2>
        <Suspense fallback={<HouseMembersSkeleton />}>
          <HouseMembers slug={slug} />
        </Suspense>
      </section>
    </>
  );
}

function HouseHero({ house }: { house: House }) {
  const style = HOUSE_STYLES[house.slug];
  const [primary, secondary] = house.colors;

  return (
    <section aria-labelledby="house-title" className={cn("relative overflow-hidden bg-gradient-to-br", style.gradient)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-night-950/35" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(ellipse 70% 60% at 15% 0%, ${secondary}40, transparent 65%), radial-gradient(ellipse 50% 50% at 90% 100%, ${primary}66, transparent 70%)`,
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night-950 to-transparent" />

      <div className="container-page relative py-12 sm:py-16">
        <Link href="/houses" className="btn-ghost -ml-4 text-sm">
          <span aria-hidden>←</span> All houses
        </Link>
        <div className="mt-6 flex flex-col gap-8 sm:flex-row sm:items-center">
          <HouseCrest house={house} size={128} className="animate-float drop-shadow-[0_16px_32px_rgba(0,0,0,0.6)]" />
          <div className="max-w-2xl">
            <p className="eyebrow text-gold-200/80">Hogwarts house</p>
            <h1 id="house-title" className="heading-xl animate-fade-up">
              {house.name}
            </h1>
            <p className={cn("mt-3 text-xl italic sm:text-2xl", style.text)}>“{house.motto}”</p>
            <p className="mt-2 text-muted">
              Founded by <span className="text-parchment">{house.founder}</span>
            </p>
            <p className="mt-5 text-lg text-parchment/90">{house.description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="card p-5">
      <dt className="eyebrow text-[11px]">{label}</dt>
      <dd className="mt-2 text-parchment">{children}</dd>
    </div>
  );
}
