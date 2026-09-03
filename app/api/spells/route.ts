import type { NextRequest } from "next/server";
import { getSpells, HpApiError } from "@/lib/hp-api";
import type { Spell } from "@/lib/types";

/**
 * GET /api/spells?q=
 * Returns `{ items, total }` — the full spell list, or the subset whose name
 * or description contains `q` (case-insensitive). The dataset is small and
 * changes rarely, so responses are CDN-cacheable for an hour.
 */

function normalize(q: string | null): string {
  return (q ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function matches(spell: Spell, q: string): boolean {
  return spell.name.toLowerCase().includes(q) || spell.description.toLowerCase().includes(q);
}

export async function GET(req: NextRequest) {
  const q = normalize(req.nextUrl.searchParams.get("q"));

  try {
    const all = await getSpells();
    const items = q ? all.filter((s) => matches(s, q)) : all;
    return Response.json(
      { items, total: items.length },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (err) {
    if (err instanceof HpApiError) {
      return Response.json(
        { error: "The Harry Potter API is not answering right now. Please try again shortly." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[api/spells]", err);
    return Response.json(
      { error: "Something went wrong while fetching spells." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
