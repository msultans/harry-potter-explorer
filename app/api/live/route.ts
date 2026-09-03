import { NextResponse } from "next/server";
import {
  CHARACTERS_TABLE,
  FAVORITE_EVENTS_TABLE,
  FAVORITE_LEADERBOARD_VIEW,
  SPELLS_TABLE,
  describeError,
  getSupabase,
  type Database,
  type FavoriteEventRow,
  type LeaderboardRow,
  type LiveSnapshot,
  type Supabase,
} from "@/lib/supabase";

/**
 * GET /api/live: one-shot snapshot for the live page. The latest favourite
 * events, the leaderboard, row totals and the last catalogue sync time.
 * Real-time updates come from /api/live/stream; the client also polls this
 * endpoint as a fallback when Server-Sent Events are unavailable.
 */

export const dynamic = "force-dynamic";

const RECENT_LIMIT = 30;
const LEADERBOARD_LIMIT = 10;
const NO_STORE = { "Cache-Control": "no-store" };

type TableName = keyof Database["public"]["Tables"];

const EMPTY: LiveSnapshot = {
  configured: false,
  recent: [],
  leaderboard: [],
  totals: { characters: 0, spells: 0, events: 0 },
  lastSyncedAt: null,
};

function respond(body: LiveSnapshot, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

async function fetchRecent(supabase: Supabase): Promise<FavoriteEventRow[]> {
  const { data, error } = await supabase
    .from(FAVORITE_EVENTS_TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(RECENT_LIMIT);
  if (error) throw error;
  return data;
}

/** Same maths as the SQL view, over whatever events we already hold. */
function aggregateLeaderboard(events: FavoriteEventRow[]): LeaderboardRow[] {
  const byCharacter = new Map<string, LeaderboardRow>();
  for (const event of events) {
    const entry = byCharacter.get(event.character_id) ?? {
      character_id: event.character_id,
      character_name: event.character_name,
      house: event.house,
      score: 0,
      last_event_at: event.created_at,
    };
    entry.score += event.action === "add" ? 1 : -1;
    if (event.created_at > entry.last_event_at) entry.last_event_at = event.created_at;
    byCharacter.set(event.character_id, entry);
  }
  return [...byCharacter.values()]
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.last_event_at.localeCompare(a.last_event_at))
    .slice(0, LEADERBOARD_LIMIT);
}

async function fetchLeaderboard(
  supabase: Supabase,
  recent: FavoriteEventRow[],
): Promise<LeaderboardRow[]> {
  try {
    const { data, error } = await supabase
      .from(FAVORITE_LEADERBOARD_VIEW)
      .select("*")
      .gt("score", 0)
      .order("score", { ascending: false })
      .order("last_event_at", { ascending: false })
      .limit(LEADERBOARD_LIMIT);
    if (error || !data) return aggregateLeaderboard(recent);
    return data;
  } catch {
    return aggregateLeaderboard(recent);
  }
}

async function countRows(supabase: Supabase, table: TableName): Promise<number> {
  try {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function fetchLastSyncedAt(supabase: Supabase): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from(CHARACTERS_TABLE)
      .select("synced_at")
      .order("synced_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data.synced_at;
  } catch {
    return null;
  }
}

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) return respond(EMPTY);

  let recent: FavoriteEventRow[];
  try {
    recent = await fetchRecent(supabase);
  } catch (err) {
    return respond({ ...EMPTY, configured: true, error: describeError(err) }, 502);
  }

  const [leaderboard, characters, spells, events, lastSyncedAt] = await Promise.all([
    fetchLeaderboard(supabase, recent),
    countRows(supabase, CHARACTERS_TABLE),
    countRows(supabase, SPELLS_TABLE),
    countRows(supabase, FAVORITE_EVENTS_TABLE),
    fetchLastSyncedAt(supabase),
  ]);

  return respond({
    configured: true,
    recent,
    leaderboard,
    totals: { characters, spells, events },
    lastSyncedAt,
  });
}
