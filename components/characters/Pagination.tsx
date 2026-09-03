"use client";

import { cn } from "@/lib/utils";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

type Item =
  | { type: "page"; page: number; /** Outer neighbours — hidden on narrow screens. */ compact: boolean }
  | { type: "gap"; key: string };

/** First, last and current ± radius; single-page gaps show the page itself instead of an ellipsis. */
function buildWindow(page: number, totalPages: number, radius = 2): Item[] {
  const pages = new Set<number>([1, totalPages]);
  for (let p = page - radius; p <= page + radius; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);

  const items: Item[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev === 2) items.push({ type: "page", page: prev + 1, compact: true });
    else if (p - prev > 2) items.push({ type: "gap", key: `gap-${prev}` });
    const isEdge = p === 1 || p === totalPages;
    items.push({ type: "page", page: p, compact: !isEdge && Math.abs(p - page) === radius });
    prev = p;
  }
  return items;
}

const PILL =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const IDLE = "border-white/15 text-parchment-dim hover:border-gold-500/50 hover:text-gold-200";
const CURRENT = "border-gold-500 bg-gold-500 text-night-950";

export function Pagination({ page, totalPages, onPageChange, className }: Props) {
  if (totalPages <= 1) return null;
  const items = buildWindow(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-col items-center gap-4 sm:flex-row sm:justify-between", className)}
    >
      <p className="text-sm text-muted">
        Page {page} of {totalPages}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={cn(PILL, IDLE)}
        >
          <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
          <span className="hidden sm:inline">Prev</span>
        </button>

        {items.map((item) =>
          item.type === "gap" ? (
            <span key={item.key} aria-hidden className="px-1 text-parchment-dim">
              …
            </span>
          ) : (
            <button
              key={item.page}
              type="button"
              onClick={() => onPageChange(item.page)}
              aria-label={`Page ${item.page}`}
              aria-current={item.page === page ? "page" : undefined}
              className={cn(PILL, item.page === page ? CURRENT : IDLE, item.compact && "hidden sm:inline-flex")}
            >
              {item.page}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className={cn(PILL, IDLE)}
        >
          <span className="hidden sm:inline">Next</span>
          <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
