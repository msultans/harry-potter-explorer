"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { HouseChip, Leaderboard } from "@/components/live/Leaderboard";
import { cn } from "@/lib/utils";
import type { FavoriteEventRow, LeaderboardRow, LiveSnapshot, LiveTotals } from "@/lib/supabase";

/**
 * Client half of /live. Loads a snapshot from /api/live, then listens to
 * /api/live/stream (Server-Sent Events) for new favourite events. If the stream
 * fails twice in a row it falls back to polling /api/live every 5 s.
 *
 * The browser only ever talks to our own API; Supabase stays server-side.
 */

const MAX_EVENTS = 50;
const LEADERBOARD_SIZE = 10;
const POLL_INTERVAL_MS = 5_000;
const CLOCK_INTERVAL_MS = 10_000;
const MAX_STREAM_ERRORS = 2;

type ConnectionStatus = "connecting" | "live" | "reconnecting" | "polling";

interface State {
  loading: boolean;
  error: string | null;
  events: FavoriteEventRow[];
  leaderboard: LeaderboardRow[];
  totals: LiveTotals;
  lastSyncedAt: string | null;
  status: ConnectionStatus;
  /** Wall clock for relative times; refreshed on every update and every 10 s. */
  now: number;
}

type Action =
  | { type: "snapshot"; snapshot: LiveSnapshot; now: number }
  | { type: "snapshot_failed"; message: string; now: number }
  | { type: "favorite"; event: FavoriteEventRow; now: number }
  | { type: "status"; status: ConnectionStatus }
  | { type: "tick"; now: number }
  | { type: "retry" };

const INITIAL_STATE: State = {
  loading: true,
  error: null,
  events: [],
  leaderboard: [],
  totals: { characters: 0, spells: 0, events: 0 },
  lastSyncedAt: null,
  status: "connecting",
  now: 0,
};

/** Union of two event lists, newest first, capped. Incoming rows win on id clashes. */
function mergeEvents(existing: FavoriteEventRow[], incoming: FavoriteEventRow[]): FavoriteEventRow[] {
  const byId = new Map<number, FavoriteEventRow>();
  for (const event of existing) byId.set(event.id, event);
  for (const event of incoming) byId.set(event.id, event);
  return [...byId.values()].sort((a, b) => b.id - a.id).slice(0, MAX_EVENTS);
}

/** Optimistic leaderboard update (+1 / -1); the periodic snapshot reconciles it. */
function applyToLeaderboard(board: LeaderboardRow[], event: FavoriteEventRow): LeaderboardRow[] {
  const delta = event.action === "add" ? 1 : -1;
  const known = board.some((row) => row.character_id === event.character_id);
  let next: LeaderboardRow[];
  if (known) {
    next = board.map((row) =>
      row.character_id === event.character_id
        ? { ...row, score: row.score + delta, last_event_at: event.created_at }
        : row,
    );
  } else if (delta > 0) {
    next = [
      ...board,
      {
        character_id: event.character_id,
        character_name: event.character_name,
        house: event.house,
        score: 1,
        last_event_at: event.created_at,
      },
    ];
  } else {
    return board;
  }
  return next
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || b.last_event_at.localeCompare(a.last_event_at))
    .slice(0, LEADERBOARD_SIZE);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "snapshot":
      return {
        ...state,
        loading: false,
        error: null,
        now: action.now,
        events: mergeEvents(state.events, action.snapshot.recent),
        leaderboard: action.snapshot.leaderboard,
        totals: action.snapshot.totals,
        lastSyncedAt: action.snapshot.lastSyncedAt,
      };
    case "snapshot_failed":
      return { ...state, loading: false, error: action.message, now: action.now };
    case "favorite":
      if (state.events.some((event) => event.id === action.event.id)) return state;
      return {
        ...state,
        now: action.now,
        events: [action.event, ...state.events].slice(0, MAX_EVENTS),
        leaderboard: applyToLeaderboard(state.leaderboard, action.event),
        totals: { ...state.totals, events: state.totals.events + 1 },
      };
    case "status":
      return state.status === action.status ? state : { ...state, status: action.status };
    case "tick":
      return { ...state, now: action.now };
    case "retry":
      return { ...state, loading: true, error: null, status: "connecting" };
  }
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function parseFavorite(raw: string): FavoriteEventRow | null {
  const value = parseJson(raw);
  if (!value || typeof value !== "object") return null;
  const { id, character_id, character_name, house, action, created_at } = value as Record<
    string,
    unknown
  >;
  if (typeof id !== "number" || typeof character_id !== "string") return null;
  if (typeof character_name !== "string" || typeof created_at !== "string") return null;
  if (action !== "add" && action !== "remove") return null;
  return {
    id,
    character_id,
    character_name,
    house: typeof house === "string" ? house : "",
    action,
    created_at,
  };
}

function relativeTime(iso: string, now: number): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_META: Record<ConnectionStatus, { label: string; dot: string; text: string; hint: string }> = {
  live: {
    label: "Live",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    hint: "Connected. New favourites appear the moment they happen.",
  },
  connecting: {
    label: "Connecting",
    dot: "bg-gold-400 animate-pulse",
    text: "text-gold-300",
    hint: "Opening the live stream.",
  },
  reconnecting: {
    label: "Reconnecting",
    dot: "bg-amber-400 animate-pulse",
    text: "text-amber-300",
    hint: "The stream dropped; trying again.",
  },
  polling: {
    label: "Polling",
    dot: "bg-zinc-400",
    text: "text-zinc-300",
    hint: "Live stream unavailable; refreshing every 5 seconds instead.",
  },
};

function StatusPill({ status }: { status: ConnectionStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      role="status"
      aria-live="polite"
      title={meta.hint}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-night-900/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
        meta.text,
      )}
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        {status === "live" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", meta.dot)} />
      </span>
      {meta.label}
    </span>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      aria-hidden
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      <path d="M12 21s-7.5-4.6-9.5-9.1C1.1 8.6 3.2 5 6.6 5c2 0 3.3 1.1 4.1 2.3L12 8.6l1.3-1.3C14.1 6.1 15.4 5 17.4 5c3.4 0 5.5 3.6 4.1 6.9C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

function ActivityItem({ event, now }: { event: FavoriteEventRow; now: number }) {
  const added = event.action === "add";
  return (
    <li className="flex items-start gap-3 py-3 animate-fade-up">
      <span
        aria-hidden
        className={cn(
          "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
          added
            ? "border-gold-500/60 bg-gold-500/15 text-gold-300"
            : "border-white/15 bg-white/5 text-parchment-dim",
        )}
      >
        <HeartIcon filled={added} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-parchment">
          <Link
            href={`/characters/${event.character_id}`}
            className="font-display text-sm font-semibold text-gold-200 transition-colors hover:text-gold-300"
          >
            {event.character_name}
          </Link>{" "}
          {added ? "was added to favourites" : "was removed from favourites"}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
          <HouseChip house={event.house} />
          <time dateTime={event.created_at}>{relativeTime(event.created_at, now)}</time>
        </div>
      </div>
    </li>
  );
}

function ActivitySkeleton() {
  return (
    <ul aria-busy aria-label="Loading activity" className="divide-y divide-white/5">
      {Array.from({ length: 5 }, (_, i) => (
        <li key={i} className="flex items-start gap-3 py-3">
          <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-white/10" />
          <span className="flex-1 space-y-2">
            <span className="block h-3.5 w-3/5 animate-pulse rounded bg-white/10" />
            <span className="block h-3 w-1/3 animate-pulse rounded bg-white/5" />
          </span>
        </li>
      ))}
    </ul>
  );
}

function EmptyActivity() {
  return (
    <div className="rounded-xl border border-dashed border-white/15 px-6 py-10 text-center">
      <p className="font-display text-lg text-gold-200">Quiet for now</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        Favourites from every visitor will appear here the moment they happen. Try it yourself:
        open a character and tap the heart.
      </p>
      <Link href="/characters" className="btn-outline mt-5">
        Browse characters
      </Link>
    </div>
  );
}

function FeedError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
    >
      <span>The feed could not be loaded: {message}</span>
      <button type="button" onClick={onRetry} className="btn-outline px-4 py-1.5 text-xs">
        Retry
      </button>
    </div>
  );
}

const TOTAL_LABELS: Array<{ key: keyof LiveTotals; label: string }> = [
  { key: "characters", label: "Characters" },
  { key: "spells", label: "Spells" },
  { key: "events", label: "Events" },
];

export function LiveFeed() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let disposed = false;
    let source: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let errorStreak = 0;
    let opened = 0;

    const loadSnapshot = async (): Promise<LiveSnapshot | null> => {
      try {
        const res = await fetch("/api/live", { cache: "no-store" });
        const body = (await res.json()) as LiveSnapshot;
        if (!res.ok) throw new Error(body.error ?? `the feed answered with HTTP ${res.status}`);
        if (!disposed) dispatch({ type: "snapshot", snapshot: body, now: Date.now() });
        return body;
      } catch (err) {
        if (!disposed) {
          const message = err instanceof Error ? err.message : "network error";
          dispatch({ type: "snapshot_failed", message, now: Date.now() });
        }
        return null;
      }
    };

    const startPolling = () => {
      if (disposed || pollTimer) return;
      source?.close();
      source = null;
      dispatch({ type: "status", status: "polling" });
      pollTimer = setInterval(() => void loadSnapshot(), POLL_INTERVAL_MS);
    };

    const openStream = (sinceId: number | null) => {
      if (disposed) return;
      if (typeof EventSource === "undefined") {
        startPolling();
        return;
      }
      const url = sinceId === null ? "/api/live/stream" : `/api/live/stream?since=${sinceId}`;
      const es = new EventSource(url);
      source = es;

      es.onopen = () => {
        errorStreak = 0;
        opened += 1;
        dispatch({ type: "status", status: "live" });
        // The server ends every stream after ~50 s; each reconnection re-syncs
        // the snapshot so the leaderboard and totals never drift.
        if (opened > 1) void loadSnapshot();
      };
      es.addEventListener("status", (e) => {
        const payload = parseJson((e as MessageEvent<string>).data);
        if (payload && typeof payload === "object" && (payload as { configured?: unknown }).configured === false) {
          startPolling();
        }
      });
      es.addEventListener("favorite", (e) => {
        const row = parseFavorite((e as MessageEvent<string>).data);
        if (row) dispatch({ type: "favorite", event: row, now: Date.now() });
      });
      es.onerror = () => {
        if (disposed) return;
        errorStreak += 1;
        if (es.readyState === EventSource.CLOSED || errorStreak >= MAX_STREAM_ERRORS) {
          startPolling();
          return;
        }
        dispatch({ type: "status", status: "reconnecting" });
      };
    };

    void loadSnapshot().then((snapshot) => {
      if (disposed) return;
      openStream(snapshot ? (snapshot.recent[0]?.id ?? 0) : null);
    });

    const clock = setInterval(() => dispatch({ type: "tick", now: Date.now() }), CLOCK_INTERVAL_MS);

    return () => {
      disposed = true;
      source?.close();
      if (pollTimer) clearInterval(pollTimer);
      clearInterval(clock);
    };
  }, [attempt]);

  const retry = () => {
    dispatch({ type: "retry" });
    setAttempt((n) => n + 1);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
      <section aria-labelledby="live-activity" className="card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="live-activity" className="font-display text-xl font-semibold text-gold-200">
            Activity
          </h2>
          <StatusPill status={state.status} />
        </div>

        {state.loading ? (
          <ActivitySkeleton />
        ) : (
          <>
            {state.error !== null && <FeedError message={state.error} onRetry={retry} />}
            {state.events.length === 0 ? (
              !state.error && <EmptyActivity />
            ) : (
              <ol className="divide-y divide-white/5" aria-label="Recent favourites">
                {state.events.map((event) => (
                  <ActivityItem key={event.id} event={event} now={state.now} />
                ))}
              </ol>
            )}
          </>
        )}
      </section>

      <aside className="space-y-6">
        <section aria-labelledby="live-leaderboard" className="card p-5 sm:p-6">
          <h2 id="live-leaderboard" className="font-display text-xl font-semibold text-gold-200">
            Leaderboard
          </h2>
          <p className="mt-1 text-sm text-muted">Most-favourited characters, adds minus removes.</p>
          <Leaderboard entries={state.leaderboard} loading={state.loading} className="mt-5" />
        </section>

        <section aria-labelledby="live-synced" className="card p-5 sm:p-6">
          <h2 id="live-synced" className="font-display text-xl font-semibold text-gold-200">
            Synced data
          </h2>
          <p className="mt-1 text-sm text-muted">Rows currently mirrored in Supabase.</p>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
            {TOTAL_LABELS.map(({ key, label }) => (
              <div key={key} className="rounded-xl border border-white/10 bg-night-900/60 px-2 py-3">
                <dt className="text-[11px] uppercase tracking-[0.2em] text-gold-500">{label}</dt>
                <dd className="mt-1 font-display text-xl font-semibold tabular-nums text-parchment">
                  {state.loading ? "—" : state.totals[key].toLocaleString("en-US")}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-muted">
            {state.loading ? (
              <span className="block h-4 w-2/3 animate-pulse rounded bg-white/10" />
            ) : state.lastSyncedAt ? (
              <>
                Last sync:{" "}
                <time dateTime={state.lastSyncedAt} className="text-parchment">
                  {formatDateTime(state.lastSyncedAt)}
                </time>
              </>
            ) : (
              <>
                Catalogue not exported yet. Run{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-gold-200">
                  node scripts/sync-supabase.mjs
                </code>{" "}
                to fill it.
              </>
            )}
          </p>
        </section>
      </aside>
    </div>
  );
}
