"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CharacterCard } from "@/components/CharacterCard";
import { CatalogSkeleton } from "@/components/characters/CatalogSkeleton";
import { HouseFilter } from "@/components/characters/HouseFilter";
import { Pagination } from "@/components/characters/Pagination";
import { SearchBar } from "@/components/characters/SearchBar";
import { HOUSE_BY_SLUG, isHouseSlug } from "@/lib/houses";
import { cn } from "@/lib/utils";
import type { Character, CharacterQuery, HouseSlug, Paginated } from "@/lib/types";

const DEBOUNCE_MS = 300;
const UPSTREAM_MESSAGE =
  "The Harry Potter API is not answering — it may be waking up from a nap. Try again in a moment.";
const GENERIC_MESSAGE = "We couldn’t reach the archive. Check your connection and try again.";

/** The part of the query the visitor controls; `pageSize` is fixed for the life of the page. */
interface CatalogQuery {
  q: string;
  house: HouseSlug | "";
  page: number;
}

interface Result {
  query: CatalogQuery;
  data: Paginated<Character>;
}

interface Props {
  initialQuery: CharacterQuery;
  /** Server-rendered first page, or null when the server fetch failed and the client must load it. */
  initialData: Paginated<Character> | null;
}

interface LooseQuery {
  q?: string | null;
  house?: string | null;
  page?: number | string | null;
}

function normalize(input: LooseQuery): CatalogQuery {
  const house = (input.house ?? "").toLowerCase();
  const page = Number(input.page ?? 1);
  return {
    q: (input.q ?? "").trim(),
    house: isHouseSlug(house) ? house : "",
    page: Number.isFinite(page) && page >= 1 ? Math.trunc(page) : 1,
  };
}

function fromSearchParams(params: URLSearchParams): CatalogQuery {
  return normalize({ q: params.get("q"), house: params.get("house"), page: params.get("page") });
}

function sameQuery(a: CatalogQuery, b: CatalogQuery): boolean {
  return a.q === b.q && a.house === b.house && a.page === b.page;
}

function buildParams(query: CatalogQuery, pageSize: number | undefined): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.house) params.set("house", query.house);
  if (query.page > 1) params.set("page", String(query.page));
  if (pageSize) params.set("pageSize", String(pageSize));
  return params;
}

async function fetchCatalog(params: URLSearchParams, signal: AbortSignal): Promise<Paginated<Character>> {
  const res = await fetch(`/api/characters?${params}`, { signal, headers: { accept: "application/json" } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error === "upstream_unavailable" ? UPSTREAM_MESSAGE : GENERIC_MESSAGE);
  }
  const data = (await res.json()) as Paginated<Character>;
  if (!Array.isArray(data.items)) throw new Error(GENERIC_MESSAGE);
  return data;
}

const formatCount = (n: number) => n.toLocaleString("en-US");

/**
 * Searchable, filterable, paginated character grid.
 *
 * The committed query lives in state (so fetches start instantly) and is mirrored to the
 * URL with `router.replace`; when the URL changes underneath us (back/forward) the query
 * is re-derived from `useSearchParams`. Data comes only from our own /api/characters.
 */
export function CharacterCatalog({ initialQuery, initialData }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sectionRef = useRef<HTMLElement>(null);
  const pageSize = initialQuery.pageSize;

  const [initial] = useState(() => normalize(initialQuery));
  const [committed, setCommitted] = useState<CatalogQuery>(initial);
  const [text, setText] = useState(initial.q);
  const [result, setResult] = useState<Result | null>(
    initialData ? { query: initial, data: initialData } : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Only keep ?pageSize in the address bar when the visitor arrived with one.
  const [keepPageSizeParam] = useState(() => searchParams.has("pageSize"));

  // Back/forward navigation: adopt the URL's query when it changes underneath us.
  const urlKey = searchParams.toString();
  const [seenUrlKey, setSeenUrlKey] = useState(urlKey);
  if (urlKey !== seenUrlKey) {
    setSeenUrlKey(urlKey);
    const fromUrl = fromSearchParams(searchParams);
    if (!sameQuery(fromUrl, committed)) {
      setCommitted(fromUrl);
      setText(fromUrl.q);
      setError(null);
    }
  }

  const needsFetch = result === null || !sameQuery(result.query, committed);
  const loading = needsFetch && error === null;

  useEffect(() => {
    if (!needsFetch) return;
    const controller = new AbortController();
    fetchCatalog(buildParams(committed, pageSize), controller.signal)
      .then((data) => {
        setResult({ query: committed, data });
        setError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : GENERIC_MESSAGE);
      });
    return () => controller.abort();
  }, [needsFetch, committed, pageSize, attempt]);

  const commit = useCallback(
    (next: CatalogQuery) => {
      setCommitted(next);
      setError(null);
      const params = buildParams(next, keepPageSizeParam ? pageSize : undefined).toString();
      router.replace(params ? `${pathname}?${params}` : pathname, { scroll: false });
    },
    [router, pathname, pageSize, keepPageSizeParam],
  );

  // Debounce typed text into the committed query.
  useEffect(() => {
    const q = text.trim();
    if (q === committed.q) return;
    const timer = setTimeout(() => commit({ ...committed, q, page: 1 }), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, committed, commit]);

  const handleTextChange = (value: string) => {
    setText(value);
    // Clearing should feel instant — no need to wait for the debounce.
    if (value.trim() === "" && committed.q !== "") commit({ ...committed, q: "", page: 1 });
  };

  const flushText = () => {
    const q = text.trim();
    if (q !== committed.q) commit({ ...committed, q, page: 1 });
  };

  const handleHouseChange = (house: HouseSlug | "") => {
    if (house === committed.house) return;
    commit({ q: text.trim(), house, page: 1 });
  };

  const handlePageChange = (page: number) => {
    if (page === committed.page) return;
    commit({ ...committed, page });
    sectionRef.current?.scrollIntoView({ block: "start" });
  };

  const clearFilters = () => {
    setText("");
    commit({ q: "", house: "", page: 1 });
  };

  const retry = () => {
    setError(null);
    setAttempt((n) => n + 1);
  };

  const data = result?.data ?? null;
  const shown = result?.query ?? committed;
  const hasFilters = committed.q !== "" || committed.house !== "";
  const houseName = shown.house ? HOUSE_BY_SLUG[shown.house].name : "";

  let status: string;
  if (loading) status = "Searching the archives…";
  else if (error) status = "The search could not be completed.";
  else if (!data || data.total === 0) status = "No characters match this search.";
  else {
    const start = (data.page - 1) * data.pageSize + 1;
    const end = start + data.items.length - 1;
    status = `Showing ${formatCount(start)}–${formatCount(end)} of ${formatCount(data.total)} characters`;
    if (shown.q) status += ` matching “${shown.q}”`;
    if (houseName) status += ` in ${houseName}`;
  }

  return (
    <section
      ref={sectionRef}
      aria-labelledby="catalog-heading"
      aria-busy={loading}
      className="container-page scroll-mt-20 pb-16"
    >
      <h2 id="catalog-heading" className="sr-only">
        Character catalogue
      </h2>

      <div className="card flex flex-col gap-4 p-4 sm:p-5">
        <SearchBar value={text} onChange={handleTextChange} onSubmit={flushText} />
        <HouseFilter value={committed.house} onChange={handleHouseChange} />
      </div>

      <div className="mt-4 flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-muted">
          {status}
        </p>
        {hasFilters && !loading && (
          <button type="button" onClick={clearFilters} className="btn-ghost -mr-3 px-3 py-1 text-xs">
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-4">
        {error ? (
          <div role="alert" className="card px-6 py-12 text-center">
            <p className="eyebrow mb-3">Owl post delayed</p>
            <h3 className="font-display text-2xl font-semibold text-gold-200">The archive is unreachable</h3>
            <p className="mx-auto mt-3 max-w-md text-muted">{error}</p>
            <button type="button" onClick={retry} className="btn-gold mt-6">
              Try again
            </button>
          </div>
        ) : data === null ? (
          <CatalogSkeleton withControls={false} announce={false} />
        ) : data.items.length === 0 ? (
          <div className="card px-6 py-12 text-center">
            <p aria-hidden className="text-4xl">
              🪄
            </p>
            <h3 className="mt-3 font-display text-2xl font-semibold text-gold-200">
              No wizards found{shown.q ? ` for “${shown.q}”` : ""}
              {houseName ? ` in ${houseName}` : ""}
            </h3>
            <p className="mx-auto mt-3 max-w-md text-muted">
              Perhaps they are hiding under an Invisibility Cloak. Try a shorter name or another house.
            </p>
            <button type="button" onClick={clearFilters} className="btn-outline mt-6">
              Clear filters
            </button>
          </div>
        ) : (
          <ul
            className={cn(
              "grid grid-cols-2 gap-4 transition-opacity duration-300 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4",
              loading && "pointer-events-none opacity-50",
            )}
          >
            {data.items.map((character, i) => (
              <li key={character.id}>
                <CharacterCard character={character} preload={i < 4} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {data && data.items.length > 0 && !error && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={handlePageChange}
          className="mt-8"
        />
      )}
    </section>
  );
}
