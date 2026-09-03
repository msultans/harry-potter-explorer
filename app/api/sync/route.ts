import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { HpApiError, getAllCharacters, getSpells } from "@/lib/hp-api";
import {
  CHARACTERS_TABLE,
  SPELLS_TABLE,
  describeError,
  getSupabase,
  toCharacterRow,
  toSpellRow,
} from "@/lib/supabase";

/**
 * POST /api/sync: exports the hp-api catalogue (characters + spells) into
 * Supabase. Protected by the `x-sync-secret` header (must equal SYNC_SECRET).
 * Run it with `node scripts/sync-supabase.mjs` or any HTTP client.
 *
 * Responses
 *   200 { characters, spells, syncedAt, durationMs }
 *   401 { error: "unauthorized" }
 *   503 { error: "sync_not_configured" | "supabase_not_configured", hint }
 *   502 { error: "hp_api_unavailable" | "supabase_error", message, ... }
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 100;

class SyncError extends Error {
  table: string;
  batch: number;
  constructor(message: string, table: string, batch: number) {
    super(message);
    this.name = "SyncError";
    this.table = table;
    this.batch = batch;
  }
}

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Writer<T> = (batch: T[]) => PromiseLike<{ error: { message: string } | null }>;

async function upsertInBatches<T>(rows: T[], table: string, write: Writer<T>): Promise<number> {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await write(batch);
    if (error) throw new SyncError(error.message, table, i / BATCH_SIZE + 1);
  }
  return rows.length;
}

export async function POST(req: Request) {
  const expected = (process.env.SYNC_SECRET ?? "").trim();
  if (!expected) {
    return NextResponse.json(
      {
        error: "sync_not_configured",
        hint: "Set SYNC_SECRET in .env.local (or your host's environment) and send it as the x-sync-secret header.",
      },
      { status: 503 },
    );
  }

  const provided = req.headers.get("x-sync-secret") ?? "";
  if (!secretsMatch(provided, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      {
        error: "supabase_not_configured",
        hint: "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see supabase/README.md).",
      },
      { status: 503 },
    );
  }

  const started = Date.now();
  try {
    const [allCharacters, allSpells] = await Promise.all([getAllCharacters(), getSpells()]);
    const syncedAt = new Date().toISOString();

    const characters = await upsertInBatches(
      allCharacters.map((c) => toCharacterRow(c, syncedAt)),
      CHARACTERS_TABLE,
      (batch) => supabase.from(CHARACTERS_TABLE).upsert(batch, { onConflict: "id" }),
    );
    const spells = await upsertInBatches(
      allSpells.map((s) => toSpellRow(s, syncedAt)),
      SPELLS_TABLE,
      (batch) => supabase.from(SPELLS_TABLE).upsert(batch, { onConflict: "id" }),
    );

    return NextResponse.json({ characters, spells, syncedAt, durationMs: Date.now() - started });
  } catch (err) {
    if (err instanceof HpApiError) {
      return NextResponse.json({ error: "hp_api_unavailable", message: err.message }, { status: 502 });
    }
    if (err instanceof SyncError) {
      return NextResponse.json(
        { error: "supabase_error", message: err.message, table: err.table, batch: err.batch },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: "sync_failed", message: describeError(err) }, { status: 500 });
  }
}
