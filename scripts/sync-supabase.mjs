#!/usr/bin/env node
/**
 * Export the Harry Potter catalogue (characters + spells) into Supabase by
 * calling this app's POST /api/sync endpoint. No dependencies (Node 18+).
 *
 * Usage
 *   node scripts/sync-supabase.mjs
 *   SYNC_URL=https://your-deployment.vercel.app node scripts/sync-supabase.mjs
 *
 * Environment (shell first, then .env.local if present)
 *   SYNC_SECRET  required: must match SYNC_SECRET on the server
 *   SYNC_URL     optional: base URL of the running app (default http://localhost:3000)
 *
 * Exits with a non-zero status when the sync fails.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REQUEST_TIMEOUT_MS = 120_000;

/** Minimal .env parser: KEY=value lines, optional quotes, `#` comments. Never overrides the shell. */
function loadDotEnv(file) {
  if (!existsSync(file)) return;
  for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/, "");
    let value = line.slice(eq + 1).trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"));
    if (quoted) value = value.slice(1, -1);
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv(resolve(ROOT, ".env.local"));

const baseUrl = (process.env.SYNC_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
const secret = (process.env.SYNC_SECRET ?? "").trim();

if (!secret) {
  console.error("SYNC_SECRET is not set. Add it to .env.local or export it in your shell, then retry.");
  process.exit(1);
}

const url = `${baseUrl}/api/sync`;
console.log(`Syncing the hp-api catalogue via ${url} ...`);

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

try {
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-sync-secret": secret, accept: "application/json" },
    signal: controller.signal,
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    console.error(`Sync failed (HTTP ${res.status}):`, JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log(
    `Synced ${body.characters} characters and ${body.spells} spells in ${body.durationMs} ms (synced_at ${body.syncedAt}).`,
  );
} catch (err) {
  const reason =
    err instanceof Error && err.name === "AbortError"
      ? "timed out"
      : err instanceof Error
        ? err.message
        : String(err);
  console.error(`Sync request failed: ${reason}`);
  process.exit(1);
} finally {
  clearTimeout(timeout);
}
