import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Character, Spell } from "./types";

/**
 * Server-only Supabase access for the optional "live feed" feature.
 *
 * Rules of the road:
 *  - The browser never talks to Supabase. Every read/write goes through our own
 *    route handlers (/api/favorites, /api/live, /api/live/stream, /api/sync),
 *    which call the helpers below with the service-role key.
 *  - Everything degrades gracefully: when SUPABASE_URL / key are missing,
 *    `getSupabase()` returns null and callers answer with an honest
 *    "not configured" instead of failing.
 *
 * Schema: supabase/schema.sql. Setup guide: supabase/README.md.
 */

export const CHARACTERS_TABLE = "characters";
export const SPELLS_TABLE = "spells";
export const FAVORITE_EVENTS_TABLE = "favorite_events";
export const FAVORITE_LEADERBOARD_VIEW = "favorite_leaderboard";

export const FAVORITE_ACTIONS = ["add", "remove"] as const;
export type FavoriteAction = (typeof FAVORITE_ACTIONS)[number];

/** Row of `public.characters`: flat columns for filtering plus the full record as JSON. */
export type CharacterRow = {
  id: string;
  name: string;
  house: string;
  species: string;
  patronus: string;
  image: string;
  alive: boolean;
  hogwarts_student: boolean;
  hogwarts_staff: boolean;
  /** The complete normalised Character, stored as jsonb. */
  data: Character;
  synced_at: string;
};
export type CharacterInsert = Omit<CharacterRow, "synced_at"> & { synced_at?: string };

/** Row of `public.spells`. */
export type SpellRow = {
  id: string;
  name: string;
  description: string;
  synced_at: string;
};
export type SpellInsert = Omit<SpellRow, "synced_at"> & { synced_at?: string };

/** Row of `public.favorite_events`: one line per heart tap, from any visitor. */
export type FavoriteEventRow = {
  id: number;
  character_id: string;
  character_name: string;
  house: string;
  action: FavoriteAction;
  created_at: string;
};
export type FavoriteEventInsert = Omit<FavoriteEventRow, "id" | "created_at">;

/** Row of the `favorite_leaderboard` view (score = adds minus removes). */
export type LeaderboardRow = {
  character_id: string;
  character_name: string;
  house: string;
  score: number;
  last_event_at: string;
};

export type LiveTotals = { characters: number; spells: number; events: number };

/** Payload of GET /api/live, which is exactly what the live page renders. */
export type LiveSnapshot = {
  configured: boolean;
  recent: FavoriteEventRow[];
  leaderboard: LeaderboardRow[];
  totals: LiveTotals;
  lastSyncedAt: string | null;
  error?: string;
};

/**
 * Typed schema for supabase-js so column names, filters and insert payloads
 * are checked at compile time (mirrors the shape `supabase gen types` emits).
 */
export type Database = {
  public: {
    Tables: {
      characters: {
        Row: CharacterRow;
        Insert: CharacterInsert;
        Update: Partial<CharacterInsert>;
        Relationships: [];
      };
      spells: {
        Row: SpellRow;
        Insert: SpellInsert;
        Update: Partial<SpellInsert>;
        Relationships: [];
      };
      favorite_events: {
        Row: FavoriteEventRow;
        Insert: FavoriteEventInsert;
        Update: Partial<FavoriteEventInsert>;
        Relationships: [];
      };
    };
    Views: {
      favorite_leaderboard: {
        Row: LeaderboardRow;
        Relationships: [];
      };
    };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Supabase = SupabaseClient<Database>;

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function readConfig(): { url: string; key: string } | null {
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY") || env("SUPABASE_ANON_KEY");
  if (!url || !key || !/^https?:\/\//i.test(url)) return null;
  return { url, key };
}

/** True when a project URL and a key (service role, or anon as a fallback) are present. */
export function isSupabaseConfigured(): boolean {
  return readConfig() !== null;
}

let cached: { key: string; client: Supabase } | null = null;

/**
 * Process-wide memoised client, or null when unconfigured. No session
 * persistence: this is a server-side, key-authenticated client.
 */
export function getSupabase(): Supabase | null {
  const config = readConfig();
  if (!config) return null;
  const key = `${config.url}|${config.key}`;
  if (!cached || cached.key !== key) {
    cached = {
      key,
      client: createClient<Database>(config.url, config.key, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      }),
    };
  }
  return cached.client;
}

export function toCharacterRow(character: Character, syncedAt: string): CharacterInsert {
  return {
    id: character.id,
    name: character.name,
    house: character.house,
    species: character.species,
    patronus: character.patronus,
    image: character.image,
    alive: character.alive,
    hogwarts_student: character.hogwartsStudent,
    hogwarts_staff: character.hogwartsStaff,
    data: character,
    synced_at: syncedAt,
  };
}

export function toSpellRow(spell: Spell, syncedAt: string): SpellInsert {
  return { id: spell.id, name: spell.name, description: spell.description, synced_at: syncedAt };
}

/** Readable message for PostgrestError / fetch failures. */
export function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const { message } = err as { message: unknown };
    if (typeof message === "string" && message) return message;
  }
  return "Unknown error";
}
