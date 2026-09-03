import { NextResponse } from "next/server";
import {
  FAVORITE_ACTIONS,
  FAVORITE_EVENTS_TABLE,
  describeError,
  getSupabase,
  type FavoriteAction,
  type FavoriteEventInsert,
} from "@/lib/supabase";

/**
 * POST /api/favorites: records a heart tap so the live feed can show it to
 * everyone. Called best-effort by lib/favorites.ts; localStorage stays the
 * source of truth for the visitor's own list.
 *
 * Responses
 *   201 { stored: true }
 *   202 { stored: false, reason: "supabase_not_configured" }   (feature off)
 *   400 { stored: false, error: "invalid_json" | "invalid_body", message }
 *   502 { stored: false, error }                                (Supabase failed)
 */

export const dynamic = "force-dynamic";

const MAX_LENGTH = 200;

type Validation = { ok: true; row: FavoriteEventInsert } | { ok: false; message: string };

function isAction(value: unknown): value is FavoriteAction {
  return typeof value === "string" && (FAVORITE_ACTIONS as readonly string[]).includes(value);
}

function validate(input: unknown): Validation {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, message: "Body must be a JSON object." };
  }
  const { action, characterId, name, house } = input as Record<string, unknown>;

  if (!isAction(action)) {
    return {
      ok: false,
      message: `"action" must be one of ${FAVORITE_ACTIONS.map((a) => `"${a}"`).join(", ")}.`,
    };
  }

  const fields: Array<{ field: string; value: unknown; required: boolean }> = [
    { field: "characterId", value: characterId, required: true },
    { field: "name", value: name, required: true },
    { field: "house", value: house, required: false },
  ];
  for (const { field, value, required } of fields) {
    if (typeof value !== "string") return { ok: false, message: `"${field}" must be a string.` };
    if (required && value.trim().length === 0) {
      return { ok: false, message: `"${field}" must not be empty.` };
    }
    if (value.length > MAX_LENGTH) {
      return { ok: false, message: `"${field}" must be at most ${MAX_LENGTH} characters.` };
    }
  }

  return {
    ok: true,
    row: {
      action,
      character_id: (characterId as string).trim(),
      character_name: (name as string).trim(),
      house: (house as string).trim(),
    },
  };
}

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { stored: false, error: "invalid_json", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const result = validate(payload);
  if (!result.ok) {
    return NextResponse.json(
      { stored: false, error: "invalid_body", message: result.message },
      { status: 400 },
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ stored: false, reason: "supabase_not_configured" }, { status: 202 });
  }

  try {
    const { error } = await supabase.from(FAVORITE_EVENTS_TABLE).insert(result.row);
    if (error) throw error;
    return NextResponse.json({ stored: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ stored: false, error: describeError(err) }, { status: 502 });
  }
}
