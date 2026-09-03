# Supabase live feed (optional bonus)

Mirrors the Harry Potter catalogue into Supabase and streams every visitor's
favourite taps back to `/live` in real time. The app works fully without it:
when the environment variables are missing, every endpoint answers with an
honest "not configured" and `/live` shows a setup guide instead of an error.

## Setup in six steps

1. **Create a project** at [supabase.com](https://supabase.com) (the free tier is enough).
2. **Open the SQL editor** in the project dashboard.
3. **Run [`schema.sql`](./schema.sql)**: paste the file and execute it. It is idempotent, so
   re-running it later is safe. It creates the tables, the leaderboard view, indexes, RLS policies
   and adds `favorite_events` to the `supabase_realtime` publication.
4. **Copy the credentials** from *Project Settings → API* into `.env.local` (locally) or your
   Vercel project's environment variables (production):

   ```bash
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service_role key>   # server-only, never shipped to the browser
   ```

   `SUPABASE_ANON_KEY` is accepted as a fallback for the key, but the service role is recommended
   because the app writes with it.
5. **Set a sync secret**: any long random string, e.g. `openssl rand -hex 32`.

   ```bash
   SYNC_SECRET=<random string>
   ```
6. **Export the catalogue and open the feed.** With the app running (`npm run dev` or a deployment):

   ```bash
   node scripts/sync-supabase.mjs
   # or, against a deployment:
   SYNC_URL=https://your-app.vercel.app node scripts/sync-supabase.mjs
   # or with any HTTP client:
   curl -X POST -H "x-sync-secret: $SYNC_SECRET" http://localhost:3000/api/sync
   ```

   Then visit `/live`. Tap a heart anywhere in the catalogue (another tab or device works best)
   and watch it appear.

Restart the dev server after editing `.env.local` so the new variables are picked up.

## What gets stored

| Table / view           | Written by            | Contents                                                   |
| ---------------------- | --------------------- | ---------------------------------------------------------- |
| `characters`           | `POST /api/sync`      | One row per hp-api character: flat columns + full `data` jsonb |
| `spells`               | `POST /api/sync`      | One row per spell                                          |
| `favorite_events`      | `POST /api/favorites` | One row per heart tap: `character_id`, `character_name`, `house`, `action` (`add`/`remove`), `created_at` |
| `favorite_leaderboard` | view                  | Per character: `score = adds − removes`, `last_event_at`   |

Row Level Security is enabled everywhere. `anon`/`authenticated` may read all three tables and the
view, and may insert into `favorite_events`; nothing else is writable from outside. The app itself
uses the service-role key from the server, so these policies only matter for the dashboard or any
future direct readers.

## Endpoints

| Route                  | Method | Purpose                                                                |
| ---------------------- | ------ | ---------------------------------------------------------------------- |
| `/api/favorites`       | POST   | Records `{ action, characterId, name, house }` (called by the heart button). `202` when unconfigured. |
| `/api/live`            | GET    | Snapshot: last 30 events, top-10 leaderboard, row totals, last sync time. |
| `/api/live/stream`     | GET    | Server-Sent Events: `status`, then one `favorite` event per new row, `ping` every 15 s. Closes after ~50 s; the browser reconnects with `Last-Event-ID`. |
| `/api/sync`            | POST   | Exports characters + spells (upsert in batches of 100). Requires `x-sync-secret`. |

## Design note: SSE with server-side polling instead of Supabase Realtime

The task requires that all external calls happen on the server, so the browser never loads
`@supabase/supabase-js` and never sees a Supabase key. Instead:

- `/api/live/stream` keeps a Server-Sent Events connection open and polls `favorite_events`
  every 2 seconds with an indexed `id > cursor` query, forwarding new rows as they land.
- Each event carries an `id:` line, so a reconnecting browser resumes exactly where it left off.
- Streams end cleanly after ~50 seconds (inside the 60-second serverless limit); `EventSource`
  reconnects automatically and the page re-syncs its snapshot on every reconnection.
- If SSE is unavailable (proxy buffering, two consecutive failures), the page falls back to
  polling `/api/live` every 5 seconds.

Trade-off: latency is up to ~2 seconds rather than sub-second, and each open stream costs one
small query every 2 seconds. In exchange the security model stays simple (one secret, one place)
and the feature works on any host that supports streaming responses. The schema still adds
`favorite_events` to the `supabase_realtime` publication, so the Supabase dashboard (or a future
client) can subscribe natively if that trade-off changes.
