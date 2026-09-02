"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Character, FavoriteEntry } from "./types";

/**
 * Favorites live in localStorage (per the task requirements). Every change is
 * also reported to our own /api/favorites endpoint so the optional Supabase
 * live feed can show activity across all visitors. That call is best-effort:
 * failures are swallowed so the feature works fully offline / unconfigured.
 */

export const FAVORITES_KEY = "hp-explorer:favorites";
const CHANGE_EVENT = "hp-explorer:favorites-change";

const EMPTY: FavoriteEntry[] = [];
let cache: FavoriteEntry[] | null = null;
let cacheRaw: string | null = null;

function read(): FavoriteEntry[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (raw === cacheRaw && cache) return cache;
    cacheRaw = raw;
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    cache = Array.isArray(parsed)
      ? (parsed.filter(
          (x) => x && typeof x === "object" && typeof (x as FavoriteEntry).id === "string",
        ) as FavoriteEntry[])
      : [];
    return cache;
  } catch {
    cache = [];
    return cache;
  }
}

function write(list: FavoriteEntry[]) {
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode — keep in-memory state only */
  }
  cache = list;
  cacheRaw = JSON.stringify(list);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE_EVENT, cb);
  };
}

export function toFavoriteEntry(c: Character): FavoriteEntry {
  return {
    id: c.id,
    name: c.name,
    house: c.house,
    image: c.image,
    patronus: c.patronus,
    addedAt: Date.now(),
  };
}

function report(action: "add" | "remove", entry: FavoriteEntry) {
  try {
    void fetch("/api/favorites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action,
        characterId: entry.id,
        name: entry.name,
        house: entry.house,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, read, () => EMPTY);
  // `hydrated` lets components avoid a flash of "not favorite" before mount.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites],
  );

  const add = useCallback((c: Character | FavoriteEntry) => {
    const entry: FavoriteEntry = "addedAt" in c ? c : toFavoriteEntry(c);
    const current = read();
    if (current.some((f) => f.id === entry.id)) return;
    write([entry, ...current]);
    report("add", entry);
  }, []);

  const remove = useCallback((id: string) => {
    const current = read();
    const entry = current.find((f) => f.id === id);
    if (!entry) return;
    write(current.filter((f) => f.id !== id));
    report("remove", entry);
  }, []);

  const toggle = useCallback(
    (c: Character | FavoriteEntry) => {
      if (read().some((f) => f.id === c.id)) remove(c.id);
      else add(c);
    },
    [add, remove],
  );

  const clear = useCallback(() => write([]), []);

  return { favorites, hydrated, isFavorite, add, remove, toggle, clear };
}
