import "server-only";
import { cache } from "react";
import { HOUSE_BY_SLUG, isHouseSlug } from "./houses";
import type { Character, CharacterQuery, HouseName, Paginated, Spell } from "./types";

/**
 * Server-only client for the public Harry Potter API (hp-api.onrender.com).
 *
 * Everything the browser sees goes through our own /api/* route handlers or
 * server components, which in turn call these functions — the external API is
 * never called from the client (task requirement).
 *
 * Caching strategy:
 *  - Next.js Data Cache via `next: { revalidate }` (1 hour) — the upstream
 *    dataset changes rarely and the Render free tier can cold-start slowly.
 *  - An in-process "last known good" map so a transient upstream outage serves
 *    stale data instead of a 500.
 */

// `||`, not `??`: container runtimes commonly inject an empty string for an
// unset variable, and an empty base URL would make every request unparsable.
const BASE = (process.env.HP_API_BASE_URL?.trim() || "https://hp-api.onrender.com/api").replace(/\/+$/, "");
const REVALIDATE_SECONDS = 3600;
export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 100;

export class HpApiError extends Error {
  status: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "HpApiError";
    this.status = status;
  }
}

const lastGood = new Map<string, unknown>();

async function hpFetch<T>(path: string): Promise<T> {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS, tags: ["hp-api"] },
    });
    if (!res.ok) throw new HpApiError(`hp-api responded ${res.status} for ${path}`, res.status);
    const data = (await res.json()) as T;
    lastGood.set(path, data);
    return data;
  } catch (err) {
    const stale = lastGood.get(path);
    if (stale !== undefined) return stale as T;
    if (err instanceof HpApiError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new HpApiError(`hp-api unreachable for ${path}: ${message}`);
  }
}

const HOUSE_NAMES = new Set<string>(["Gryffindor", "Slytherin", "Hufflepuff", "Ravenclaw"]);

/** Defensive normalisation — the upstream API is community-maintained. */
function normalizeCharacter(raw: Partial<Character> & { id: string }): Character {
  const house = HOUSE_NAMES.has(raw.house ?? "") ? (raw.house as HouseName) : "";
  return {
    id: raw.id,
    name: raw.name ?? "Unknown",
    alternate_names: Array.isArray(raw.alternate_names) ? raw.alternate_names : [],
    species: raw.species ?? "",
    gender: raw.gender ?? "",
    house,
    dateOfBirth: raw.dateOfBirth ?? null,
    yearOfBirth: typeof raw.yearOfBirth === "number" ? raw.yearOfBirth : null,
    wizard: Boolean(raw.wizard),
    ancestry: raw.ancestry ?? "",
    eyeColour: raw.eyeColour ?? "",
    hairColour: raw.hairColour ?? "",
    wand: {
      wood: raw.wand?.wood ?? "",
      core: raw.wand?.core ?? "",
      length: typeof raw.wand?.length === "number" ? raw.wand.length : null,
    },
    patronus: raw.patronus ?? "",
    hogwartsStudent: Boolean(raw.hogwartsStudent),
    hogwartsStaff: Boolean(raw.hogwartsStaff),
    actor: raw.actor ?? "",
    alternate_actors: Array.isArray(raw.alternate_actors) ? raw.alternate_actors : [],
    alive: raw.alive !== false,
    image: typeof raw.image === "string" ? raw.image : "",
  };
}

/**
 * All ~430 characters, normalised. Cached in the Data Cache for an hour and
 * deduplicated per render pass with React `cache` so several components can
 * call it freely.
 */
export const getAllCharacters = cache(async (): Promise<Character[]> => {
  const raw = await hpFetch<Array<Partial<Character> & { id: string }>>("/characters");
  return raw.filter((c) => c && typeof c.id === "string").map(normalizeCharacter);
});

export async function getCharacterById(id: string): Promise<Character | null> {
  const all = await getAllCharacters();
  const found = all.find((c) => c.id === id);
  if (found) return found;
  // Fallback for ids that are not in the list endpoint (defensive).
  try {
    const raw = await hpFetch<Array<Partial<Character> & { id: string }>>(
      `/character/${encodeURIComponent(id)}`,
    );
    return raw[0] ? normalizeCharacter(raw[0]) : null;
  } catch {
    return null;
  }
}

export async function getCharactersByHouse(slug: string): Promise<Character[]> {
  if (!isHouseSlug(slug)) return [];
  const name = HOUSE_BY_SLUG[slug].name;
  const all = await getAllCharacters();
  return all.filter((c) => c.house === name);
}

export const getSpells = cache(async (): Promise<Spell[]> => {
  const raw = await hpFetch<Spell[]>("/spells");
  return raw
    .filter((s) => s && typeof s.id === "string")
    .map((s) => ({ id: s.id, name: s.name ?? "", description: s.description ?? "" }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

export async function getStats() {
  const [characters, spells] = await Promise.all([getAllCharacters(), getSpells()]);
  return {
    characters: characters.length,
    students: characters.filter((c) => c.hogwartsStudent).length,
    staff: characters.filter((c) => c.hogwartsStaff).length,
    withImages: characters.filter((c) => c.image).length,
    spells: spells.length,
  };
}

function normalizeQuery(q: string | undefined) {
  return (q ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Pure, synchronous filtering + pagination over the full character list.
 * Kept separate from fetching so it is trivially unit-testable.
 */
export function searchCharacters(all: Character[], query: CharacterQuery): Paginated<Character> {
  const q = normalizeQuery(query.q);
  const houseName = query.house && isHouseSlug(query.house) ? HOUSE_BY_SLUG[query.house].name : null;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(query.pageSize ?? DEFAULT_PAGE_SIZE)));

  let items = all;
  if (houseName) items = items.filter((c) => c.house === houseName);
  if (q) {
    items = items.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.alternate_names.some((n) => n.toLowerCase().includes(q)),
    );
  }

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(totalPages, Math.max(1, Math.trunc(query.page ?? 1)));
  const start = (page - 1) * pageSize;

  return { items: items.slice(start, start + pageSize), total, page, pageSize, totalPages };
}

/** Parses ?q=&house=&page=&pageSize= from a URLSearchParams into a CharacterQuery. */
export function parseCharacterQuery(params: URLSearchParams): CharacterQuery {
  const house = (params.get("house") ?? "").toLowerCase();
  return {
    q: params.get("q") ?? undefined,
    house: isHouseSlug(house) ? house : "",
    page: Number(params.get("page") ?? 1) || 1,
    pageSize: Number(params.get("pageSize") ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE,
  };
}
