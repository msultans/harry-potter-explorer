"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import type { Spell } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The spell book. The whole list is ~77 entries, so the server passes it down
 * once and filtering happens instantly in the browser — no round trip per
 * keystroke. `/api/spells?q=` exists for programmatic access and applies the
 * same name/description match server-side.
 */

interface Props {
  spells: Spell[];
}

interface LetterGroup {
  letter: string;
  anchor: string;
  spells: Spell[];
}

function normalize(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

function matches(spell: Spell, q: string): boolean {
  return spell.name.toLowerCase().includes(q) || spell.description.toLowerCase().includes(q);
}

function letterOf(name: string): string {
  const first = name.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
}

/** Groups (already name-sorted) spells by first letter; non-letters land in "#" at the end. */
function groupByLetter(spells: Spell[]): LetterGroup[] {
  const buckets = new Map<string, Spell[]>();
  for (const spell of spells) {
    const letter = letterOf(spell.name);
    const bucket = buckets.get(letter);
    if (bucket) bucket.push(spell);
    else buckets.set(letter, [spell]);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)))
    .map(([letter, group]) => ({
      letter,
      anchor: letter === "#" ? "spells-other" : `spells-${letter}`,
      spells: group,
    }));
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/** Wraps every case-insensitive occurrence of `query` in a <mark>. */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const at = lower.indexOf(query, cursor);
    if (at === -1) {
      parts.push(text.slice(cursor));
      break;
    }
    if (at > cursor) parts.push(text.slice(cursor, at));
    parts.push(
      <mark key={at} className="rounded-sm bg-gold-500/25 px-0.5 text-gold-200">
        {text.slice(at, at + query.length)}
      </mark>,
    );
    cursor = at + query.length;
  }
  return <>{parts}</>;
}

function SpellCard({ spell, query }: { spell: Spell; query: string }) {
  return (
    <article className="card card-hover h-full p-4">
      <h3 className="font-display text-base font-semibold tracking-wider text-gold-300 drop-shadow-[0_0_14px_rgba(211,166,37,0.35)]">
        <span aria-hidden className="mr-1.5 text-gold-600">✦</span>
        <Highlight text={spell.name} query={query} />
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        <Highlight text={spell.description} query={query} />
      </p>
    </article>
  );
}

export function SpellBook({ spells }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const statusId = useId();

  const q = normalize(query);
  const filtered = useMemo(() => (q ? spells.filter((s) => matches(s, q)) : spells), [spells, q]);
  const groups = useMemo(() => groupByLetter(filtered), [filtered]);

  // "/" jumps to the search box from anywhere on the page (but never hijacks typing).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function clear() {
    setQuery("");
    inputRef.current?.focus();
  }

  const count = filtered.length;
  const noun = count === 1 ? "spell" : "spells";
  const status =
    spells.length === 0
      ? "The spell book is empty."
      : q
        ? `${count} of ${spells.length} ${noun} match “${query.trim()}”`
        : `${spells.length} spells, A to Z`;

  return (
    <div className="container-page pb-20">
      <div className="card p-4 sm:p-5">
        <label htmlFor={inputId} className="eyebrow mb-2 block">
          Search the book
        </label>
        <div className="relative">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gold-500"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Incantation or effect — try “Patronus” or “unlock”"
            autoComplete="off"
            spellCheck={false}
            aria-describedby={statusId}
            className="input pl-11 pr-12"
          />
          {query ? (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-parchment-dim transition-colors hover:bg-white/10 hover:text-parchment"
            >
              <svg aria-hidden viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          ) : (
            <kbd
              aria-hidden
              className="pointer-events-none absolute right-3 top-1/2 hidden h-6 min-w-6 -translate-y-1/2 items-center justify-center rounded-md border border-white/15 bg-white/5 px-1.5 font-mono text-xs text-parchment-dim sm:inline-flex"
            >
              /
            </kbd>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p id={statusId} role="status" aria-live="polite" className="text-sm text-muted">
            {status}
          </p>
          {groups.length > 1 && (
            <nav aria-label="Jump to letter" className="flex flex-wrap gap-1">
              {groups.map((g) => (
                <a
                  key={g.letter}
                  href={`#${g.anchor}`}
                  className="flex h-7 min-w-7 items-center justify-center rounded-md px-1 font-display text-xs text-gold-400 transition-colors hover:bg-gold-500/15 hover:text-gold-200"
                >
                  {g.letter}
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="card mt-10 flex flex-col items-center px-6 py-14 text-center">
          <span aria-hidden className="animate-float text-4xl">🪄</span>
          {spells.length === 0 ? (
            <>
              <h2 className="heading-lg mt-4 text-2xl sm:text-3xl">The spell book is empty</h2>
              <p className="mt-2 max-w-md text-muted">The archive returned no spells this time. Try again in a little while.</p>
            </>
          ) : (
            <>
              <h2 className="heading-lg mt-4 text-2xl sm:text-3xl">No spell answers to “{query.trim()}”</h2>
              <p className="mt-2 max-w-md text-muted">
                Try part of an incantation (“Expell”) or what it does (“unlock”, “light”, “shield”).
              </p>
              <button type="button" onClick={clear} className="btn-outline mt-6">
                Clear search
              </button>
            </>
          )}
        </div>
      ) : (
        groups.map((group) => (
          <section
            key={group.letter}
            id={group.anchor}
            aria-labelledby={`${group.anchor}-heading`}
            className="mt-10 scroll-mt-20"
          >
            <h2
              id={`${group.anchor}-heading`}
              className={cn(
                "sticky top-16 z-10 flex items-baseline gap-3 border-b border-gold-600/30 py-3",
                "bg-night-950/85 backdrop-blur-md",
              )}
            >
              <span className="font-display text-3xl font-semibold leading-none text-gold-300">{group.letter}</span>
              <span className="text-sm text-muted">
                {group.spells.length} {group.spells.length === 1 ? "spell" : "spells"}
              </span>
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.spells.map((spell) => (
                <li key={spell.id}>
                  <SpellCard spell={spell} query={q} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
