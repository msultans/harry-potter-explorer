"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { CharacterCard } from "@/components/CharacterCard";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";
import type { FavoriteEntry } from "@/lib/types";

type SortMode = "recent" | "name";

const SORT_OPTIONS: ReadonlyArray<{ value: SortMode; label: string }> = [
  { value: "recent", label: "Recently added" },
  { value: "name", label: "Name A–Z" },
];

function countLabel(n: number): string {
  return `${n} ${n === 1 ? "favourite" : "favourites"}`;
}

function sortFavorites(list: FavoriteEntry[], mode: SortMode): FavoriteEntry[] {
  if (mode === "name") {
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  }
  // The store prepends on add, so its natural order is already newest-first.
  return list;
}

/**
 * Client list for /favorites. Reads the localStorage-backed store via
 * useFavorites(); the heart on each card removes entries, so the grid simply
 * re-renders with stable ids as keys.
 */
export function FavoritesList() {
  const { favorites, hydrated, clear } = useFavorites();
  const [sort, setSort] = useState<SortMode>("recent");
  // Remembers how many favourites there were when "Clear all" was pressed. The
  // confirmation only stays open while that number is still accurate, so it
  // dismisses itself if a heart removes an entry mid-confirmation.
  const [confirmFor, setConfirmFor] = useState<number | null>(null);

  const count = favorites.length;
  // Any change to the list (a heart click here, or another tab) invalidates a
  // pending confirmation. Resetting during render means it can never resurface
  // later if the count happens to return to the remembered number.
  if (confirmFor !== null && confirmFor !== count) setConfirmFor(null);
  const showConfirm = confirmFor !== null && count > 0;
  const sorted = useMemo(() => sortFavorites(favorites, sort), [favorites, sort]);

  const clearButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const emptyHeadingRef = useRef<HTMLHeadingElement>(null);
  const restoreFocusRef = useRef(false);
  const prevCountRef = useRef<number | null>(null);

  // Keep keyboard focus meaningful while the toolbar swaps between
  // "Clear all" and its inline confirmation.
  useEffect(() => {
    if (showConfirm) {
      cancelButtonRef.current?.focus();
    } else if (restoreFocusRef.current) {
      restoreFocusRef.current = false;
      clearButtonRef.current?.focus();
    }
  }, [showConfirm]);

  // When the last favourite disappears (cleared or un-hearted), move focus to
  // the empty-state heading so assistive tech announces the change.
  useEffect(() => {
    if (!hydrated) return;
    const prev = prevCountRef.current;
    prevCountRef.current = count;
    if (prev !== null && prev > 0 && count === 0) emptyHeadingRef.current?.focus();
  }, [hydrated, count]);

  if (!hydrated) return <FavoritesSkeleton />;
  if (count === 0) return <EmptyState headingRef={emptyHeadingRef} />;

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p role="status" className="text-muted">
          <span className="font-display text-xl font-semibold text-gold-200">{count}</span>{" "}
          {count === 1 ? "favourite" : "favourites"}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <SortToggle value={sort} onChange={setSort} />
          {showConfirm ? (
            <ConfirmClear
              count={count}
              cancelRef={cancelButtonRef}
              onConfirm={() => {
                clear();
                setConfirmFor(null);
              }}
              onCancel={() => {
                restoreFocusRef.current = true;
                setConfirmFor(null);
              }}
            />
          ) : (
            <button
              ref={clearButtonRef}
              type="button"
              className="btn-ghost px-4 py-2"
              onClick={() => setConfirmFor(count)}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4" aria-label="Favourite characters">
        {sorted.map((entry) => (
          <li key={entry.id} className="animate-fade-up">
            <CharacterCard character={entry} />
          </li>
        ))}
      </ul>

      <div className="divider" aria-hidden>
        ✦
      </div>
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted">Un-heart a card to remove it. Clearing this browser&apos;s site data also clears the list.</p>
        <Link href="/characters" className="btn-outline">
          Find more characters
        </Link>
      </div>
    </div>
  );
}

/* ---------- Toolbar pieces ---------- */

function SortToggle({ value, onChange }: { value: SortMode; onChange: (mode: SortMode) => void }) {
  return (
    <div
      role="group"
      aria-label="Sort favourites"
      className="inline-flex rounded-full border border-white/15 bg-night-900/70 p-1"
    >
      {SORT_OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm tracking-wide transition-colors",
              active ? "bg-gold-500/20 text-gold-200" : "text-parchment-dim hover:text-parchment",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ConfirmClear({
  count,
  cancelRef,
  onConfirm,
  onCancel,
}: {
  count: number;
  cancelRef: RefObject<HTMLButtonElement | null>;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="group"
      aria-label="Confirm clearing favourites"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onCancel();
        }
      }}
      className="animate-fade-up flex flex-wrap items-center gap-2 rounded-full border border-red-400/40 bg-red-500/10 py-1 pl-4 pr-1 text-sm text-parchment"
    >
      <span>Really clear {countLabel(count)}?</span>
      <button
        type="button"
        onClick={onConfirm}
        className="btn bg-red-500/80 px-3.5 py-1.5 text-white hover:bg-red-400"
      >
        Yes, clear
      </button>
      {/* Focus lands on Cancel by default so a second Enter can't wipe the list by accident. */}
      <button ref={cancelRef} type="button" onClick={onCancel} className="btn-ghost px-3.5 py-1.5">
        Cancel
      </button>
    </div>
  );
}

/* ---------- Loading & empty states ---------- */

function FavoritesSkeleton() {
  return (
    <div role="status" aria-busy="true" className="animate-pulse">
      <span className="sr-only">Loading your favourites…</span>
      <div className="mb-6 flex items-center justify-between gap-4" aria-hidden>
        <div className="h-6 w-28 rounded-full bg-white/10" />
        <div className="h-9 w-64 max-w-[50%] rounded-full bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="aspect-[3/4] w-full bg-white/[0.06]" />
            <div className="space-y-2 p-4">
              <div className="h-5 w-24 rounded-full bg-white/10" />
              <div className="h-3 w-3/4 rounded-full bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ headingRef }: { headingRef: RefObject<HTMLHeadingElement | null> }) {
  return (
    <div className="card relative overflow-hidden px-6 py-14 text-center sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(211,166,37,0.14),transparent_60%)]"
      />
      <div className="relative mx-auto flex max-w-md flex-col items-center">
        <HeartIllustration />
        <h2 ref={headingRef} tabIndex={-1} className="heading-lg mt-6 focus:outline-none">
          No favourites yet
        </h2>
        <p className="mt-3 text-muted">
          Tap the heart on any character to keep them here. Your collection is saved in this browser and never
          leaves it.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/characters" className="btn-gold">
            Browse characters
          </Link>
          <Link href="/houses" className="btn-outline">
            Explore the houses
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Four-point sparkle centred at (cx, cy). */
function sparklePath(cx: number, cy: number, r: number): string {
  return `M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r} Z`;
}

const SPARKLES: ReadonlyArray<{ cx: number; cy: number; r: number; delay: string }> = [
  { cx: 22, cy: 18, r: 6, delay: "0s" },
  { cx: 100, cy: 26, r: 5, delay: "1.3s" },
  { cx: 92, cy: 92, r: 4, delay: "2.4s" },
  { cx: 16, cy: 84, r: 3.5, delay: "0.7s" },
];

function HeartIllustration() {
  return (
    <div className="animate-float h-28 w-28 sm:h-32 sm:w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="fav-empty-heart" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0dc9a" />
            <stop offset="1" stopColor="#a67c1a" />
          </linearGradient>
        </defs>
        <path
          d="M60 104S22 80 12 57C5 40 16 22 33 22c10 0 17 6 22 13l5 6 5-6c5-7 12-13 22-13 17 0 28 18 21 35-10 23-48 47-48 47z"
          fill="rgba(211,166,37,0.08)"
          stroke="url(#fav-empty-heart)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeDasharray="6 5"
        />
        {SPARKLES.map((s) => (
          <path
            key={`${s.cx}-${s.cy}`}
            d={sparklePath(s.cx, s.cy, s.r)}
            fill="#e5c46a"
            className="animate-twinkle"
            style={{ animationDelay: s.delay }}
          />
        ))}
      </svg>
    </div>
  );
}
