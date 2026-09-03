import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PageHeader } from "@/components/PageHeader";
import { SpellBook } from "@/components/spells/SpellBook";
import { getSpells } from "@/lib/hp-api";
import type { Spell } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Spells",
  description:
    "Every charm, curse, jinx and hex in the Harry Potter API, grouped A to Z with an instant search — from Accio to Wingardium Leviosa.",
};

export default async function SpellsPage() {
  let spells: Spell[] | null = null;
  try {
    spells = await getSpells();
  } catch (err) {
    console.error("[spells] failed to load spells", err);
  }

  if (spells === null) {
    // The upstream API is down and we have no last-known-good copy. Opt this
    // render out of the ISR cache so the failure isn't served for the next hour.
    await connection();
    return (
      <>
        <PageHeader
          eyebrow="Standard Book of Spells"
          title="Spells & Charms"
          description="The spell book could not be opened just now."
        />
        <div className="container-page pb-20">
          <section
            aria-labelledby="spells-error-heading"
            className="card flex flex-col items-center px-6 py-16 text-center"
          >
            <span aria-hidden className="animate-float text-4xl">📖</span>
            <h2 id="spells-error-heading" className="heading-lg mt-4 text-2xl sm:text-3xl">
              The pages refuse to turn
            </h2>
            <p className="mt-3 max-w-md text-muted">
              We couldn&rsquo;t reach the Harry Potter API. It runs on a free tier and sometimes takes a
              moment to wake up — give it another try in a few seconds.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/spells" className="btn-gold">
                Try again
              </Link>
              <Link href="/characters" className="btn-outline">
                Browse characters instead
              </Link>
            </div>
          </section>
        </div>
      </>
    );
  }

  const first = spells[0]?.name;
  const last = spells[spells.length - 1]?.name;
  const range = first && last && first !== last ? `, from ${first} to ${last}` : "";

  return (
    <>
      <PageHeader
        eyebrow="Standard Book of Spells"
        title="Spells & Charms"
        description={`${spells.length} incantations${range} — every charm, curse, jinx and hex in the archive, grouped A to Z. Press / to search.`}
      />
      <SpellBook spells={spells} />
    </>
  );
}
