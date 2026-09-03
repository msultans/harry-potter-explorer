import { FAVORITE_EVENTS_TABLE, getSupabase, type FavoriteEventRow } from "@/lib/supabase";

/**
 * GET /api/live/stream: Server-Sent Events feed of new favourite events.
 *
 * The browser never talks to Supabase. This handler polls `favorite_events`
 * every 2 s (cheap: an indexed `id > cursor` query) and forwards new rows as
 * `favorite` events. Each event carries an `id:` line, so when the browser
 * reconnects it sends `Last-Event-ID` and nothing is missed. Streams close
 * cleanly after ~50 s (under the 60 s serverless limit) and the client's
 * EventSource reconnects on its own.
 *
 * Events
 *   status   { configured: boolean }   first message; false means the stream ends
 *   favorite FavoriteEventRow          one per new row, id = row id
 *   ping     { t: epochMs }            every 15 s, keeps proxies awake
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const POLL_INTERVAL_MS = 2_000;
const PING_INTERVAL_MS = 15_000;
const STREAM_LIFETIME_MS = 50_000;
const BATCH_SIZE = 50;
const RETRY_MS = 2_000;
const MAX_CONSECUTIVE_FAILURES = 5;

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-store, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

function sse(event: string, data: unknown, id?: number): string {
  const lines = [`event: ${event}`];
  if (id !== undefined) lines.push(`id: ${id}`);
  lines.push(`data: ${JSON.stringify(data)}`);
  return `${lines.join("\n")}\n\n`;
}

function parseCursor(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

export async function GET(req: Request) {
  const supabase = getSupabase();
  const encoder = new TextEncoder();

  if (!supabase) {
    return new Response(encoder.encode(`retry: ${RETRY_MS}\n${sse("status", { configured: false })}`), {
      headers: SSE_HEADERS,
    });
  }

  // Resume point: the browser's Last-Event-ID wins, then ?since=<id> (set by
  // the client from its snapshot), otherwise "everything after right now".
  const requestedCursor =
    parseCursor(req.headers.get("last-event-id")) ??
    parseCursor(new URL(req.url).searchParams.get("since"));

  let closed = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let lifetimeTimer: ReturnType<typeof setTimeout> | null = null;

  const clearTimers = () => {
    if (pollTimer) clearInterval(pollTimer);
    if (pingTimer) clearInterval(pingTimer);
    if (lifetimeTimer) clearTimeout(lifetimeTimer);
    pollTimer = pingTimer = lifetimeTimer = null;
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const close = () => {
        if (closed) return;
        closed = true;
        clearTimers();
        try {
          controller.close();
        } catch {
          /* already closed by the runtime */
        }
      };

      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          close();
        }
      };

      req.signal.addEventListener("abort", close, { once: true });
      send(`retry: ${RETRY_MS}\n${sse("status", { configured: true })}`);

      let cursor = requestedCursor;
      if (cursor === null) {
        try {
          const { data, error } = await supabase
            .from(FAVORITE_EVENTS_TABLE)
            .select("id")
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (error) throw error;
          cursor = data?.id ?? 0;
        } catch (err) {
          console.error("[live/stream] could not read the current cursor", err);
          close();
          return;
        }
      }
      if (closed) return;

      let inFlight = false;
      let failures = 0;
      let lastSeenId: number = cursor;

      const poll = async () => {
        if (closed || inFlight) return;
        inFlight = true;
        try {
          const { data, error } = await supabase
            .from(FAVORITE_EVENTS_TABLE)
            .select("*")
            .gt("id", lastSeenId)
            .order("id", { ascending: true })
            .limit(BATCH_SIZE);
          if (error) throw error;
          failures = 0;
          for (const row of data as FavoriteEventRow[]) {
            if (row.id > lastSeenId) lastSeenId = row.id;
            send(sse("favorite", row, row.id));
          }
        } catch (err) {
          failures += 1;
          console.error(`[live/stream] poll failed (${failures}/${MAX_CONSECUTIVE_FAILURES})`, err);
          if (failures >= MAX_CONSECUTIVE_FAILURES) close();
        } finally {
          inFlight = false;
        }
      };

      pollTimer = setInterval(() => void poll(), POLL_INTERVAL_MS);
      pingTimer = setInterval(() => send(sse("ping", { t: Date.now() })), PING_INTERVAL_MS);
      lifetimeTimer = setTimeout(close, STREAM_LIFETIME_MS);
      void poll();
    },
    cancel() {
      closed = true;
      clearTimers();
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
