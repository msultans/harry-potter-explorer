import { getCharacterById, HpApiError } from "@/lib/hp-api";

/**
 * GET /api/characters/:id — a single normalised character as JSON.
 *
 * 200 → Character            (cached at the edge for an hour; the upstream
 *                             dataset changes rarely)
 * 404 → { error: "not_found" }
 * 502 → { error: "upstream_unavailable" } when hp-api cannot be reached.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/characters/[id]">) {
  const { id } = await ctx.params;

  try {
    const character = await getCharacterById(id);
    if (!character) {
      return Response.json(
        { error: "not_found" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return Response.json(character, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    if (err instanceof HpApiError) {
      return Response.json(
        { error: "upstream_unavailable", message: err.message },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }
    throw err;
  }
}
