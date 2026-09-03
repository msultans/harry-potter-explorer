import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { CatalogSkeleton } from "@/components/characters/CatalogSkeleton";
import { CharacterCatalog } from "@/components/characters/CharacterCatalog";
import { getAllCharacters, parseCharacterQuery, searchCharacters } from "@/lib/hp-api";
import type { Character, Paginated } from "@/lib/types";

export const metadata: Metadata = {
  title: "Characters",
  description:
    "Browse every witch, wizard and Muggle of the Harry Potter series — search by name, filter by house and pin your favourites.",
};

// searchParams already make this route dynamic; be explicit about it.
export const dynamic = "force-dynamic";

/** Mirrors the awaited searchParams object into URLSearchParams so the page and the API parse identically. */
function toSearchParams(raw: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else if (typeof value === "string") params.append(key, value);
  }
  return params;
}

export default async function CharactersPage({ searchParams }: PageProps<"/characters">) {
  const query = parseCharacterQuery(toSearchParams(await searchParams));

  let data: Paginated<Character> | null = null;
  let total: number | null = null;
  try {
    const all = await getAllCharacters();
    data = searchCharacters(all, query);
    total = all.length;
  } catch (err) {
    // The client catalogue will retry through /api/characters and show its error state.
    console.error("[characters] initial fetch failed", err);
  }

  const description =
    total === null
      ? "Search the whole archive by name, filter by house and pin your favourites."
      : `Search all ${total.toLocaleString("en-US")} characters of the wizarding world by name, filter by house and pin your favourites.`;

  return (
    <>
      <PageHeader eyebrow="Catalogue" title="Characters" description={description} />
      <Suspense
        fallback={
          <div className="container-page pb-16">
            <CatalogSkeleton />
          </div>
        }
      >
        <CharacterCatalog initialQuery={query} initialData={data} />
      </Suspense>
    </>
  );
}
