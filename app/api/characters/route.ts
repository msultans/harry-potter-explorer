import type { NextRequest } from "next/server";
import { getAllCharacters, HpApiError, parseCharacterQuery, searchCharacters } from "@/lib/hp-api";

/**
 * GET /api/characters — search and paginate the character catalogue.
 *
 * Query parameters:
 *  - `q`        case-insensitive substring match on the name or alternate names
 *  - `house`    gryffindor | slytherin | hufflepuff | ravenclaw (anything else = all houses)
 *  - `page`     1-based page number, clamped to the available range
 *  - `pageSize` items per page — default 24, maximum 100
 *
 * Responds with `Paginated<Character>` ({ items, total, page, pageSize, totalPages }).
 * The browser only ever talks to this route; hp-api is called server-side via lib/hp-api.ts.
 */
export async function GET(req: NextRequest) {
  const query = parseCharacterQuery(req.nextUrl.searchParams);

  try {
    const all = await getAllCharacters();
    return Response.json(searchCharacters(all, query), {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
    });
  } catch (err) {
    if (err instanceof HpApiError) {
      return Response.json({ error: "upstream_unavailable", message: err.message }, { status: 502 });
    }
    console.error("[api/characters] unexpected failure", err);
    return Response.json({ error: "internal" }, { status: 500 });
  }
}
