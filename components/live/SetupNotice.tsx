import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shown on /live when Supabase is not configured. This is a deliberate,
 * finished state (the feature is optional), so it reads as an invitation
 * rather than an error. Steps mirror supabase/README.md.
 */

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-gold-200">
      {children}
    </code>
  );
}

const STEPS: Array<{ title: string; body: ReactNode }> = [
  {
    title: "Create a Supabase project",
    body: (
      <>
        Sign in at{" "}
        <a
          href="https://supabase.com"
          target="_blank"
          rel="noreferrer noopener"
          className="underline decoration-gold-600/60 underline-offset-4 hover:text-parchment"
        >
          supabase.com
        </a>{" "}
        and create a project. The free tier is plenty.
      </>
    ),
  },
  {
    title: "Run the schema",
    body: (
      <>
        Open the SQL editor and run <Code>supabase/schema.sql</Code>. It creates the{" "}
        <Code>characters</Code>, <Code>spells</Code> and <Code>favorite_events</Code> tables, the
        leaderboard view and the security policies.
      </>
    ),
  },
  {
    title: "Add the keys",
    body: (
      <>
        Copy the project URL and the <em>service_role</em> key into <Code>.env.local</Code> as{" "}
        <Code>SUPABASE_URL</Code> and <Code>SUPABASE_SERVICE_ROLE_KEY</Code>, or into your Vercel
        environment variables. They stay on the server.
      </>
    ),
  },
  {
    title: "Choose a sync secret",
    body: (
      <>
        Set <Code>SYNC_SECRET</Code> to any long random string. It guards the export endpoint.
      </>
    ),
  },
  {
    title: "Export the catalogue",
    body: (
      <>
        Run <Code>node scripts/sync-supabase.mjs</Code> (or POST <Code>/api/sync</Code> with an{" "}
        <Code>x-sync-secret</Code> header) to copy every character and spell across.
      </>
    ),
  },
  {
    title: "Restart and come back",
    body: (
      <>
        Restart the server so the new environment is picked up, then reload <Code>/live</Code>.
      </>
    ),
  },
];

const FLOW = [
  { label: "Browser", note: "EventSource" },
  { label: "/api/live/stream", note: "Server-Sent Events" },
  { label: "Supabase", note: "polled every 2 s" },
];

export function SetupNotice() {
  return (
    <div className="card overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-transparent via-gold-500/70 to-transparent" />
      <div className="grid gap-10 p-6 sm:p-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12">
        <div>
          <p className="eyebrow mb-3">Optional feature</p>
          <h2 className="heading-lg">The live feed is resting</h2>
          <p className="mt-4 max-w-xl text-muted">
            This page comes alive once a Supabase project is connected: every heart tapped by any
            visitor is recorded there and streamed back here as it happens, alongside a leaderboard
            of the most-loved characters. Until then, favourites are kept safely in your browser and
            nothing else changes.
          </p>

          <ol className="mt-8 space-y-5">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-500/50 bg-gold-500/10 font-display text-sm font-semibold text-gold-300"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-gold-200">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/characters" className="btn-gold">
              Browse characters
            </Link>
            <Link href="/favorites" className="btn-outline">
              Your favourites
            </Link>
          </div>
        </div>

        <aside className="space-y-6 lg:border-l lg:border-white/10 lg:pl-10">
          <div>
            <p className="eyebrow mb-3">How it works</p>
            <ol className="space-y-2">
              {FLOW.map((node, index) => (
                <li key={node.label} className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={index === 0 ? "text-gold-500" : "text-gold-600"}
                  >
                    {index === 0 ? "◉" : "↓"}
                  </span>
                  <span className="rounded-lg border border-white/10 bg-night-900/70 px-3 py-1.5 font-mono text-sm text-parchment">
                    {node.label}
                  </span>
                  <span className="text-xs text-muted">{node.note}</span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <p className="eyebrow mb-3">Once enabled</p>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex gap-2">
                <span aria-hidden className="text-gold-500">
                  &#10022;
                </span>
                A live activity stream with a green pulse when connected.
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="text-gold-500">
                  &#10022;
                </span>
                A leaderboard of the most-favourited characters across all visitors.
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="text-gold-500">
                  &#10022;
                </span>
                Totals of the mirrored catalogue and the time of the last export.
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-night-900/60 p-4 text-sm text-muted">
            <p>
              <span className="font-semibold text-parchment">Keys never reach the browser.</span>{" "}
              Every Supabase call runs in our own route handlers; the page only talks to{" "}
              <Code>/api/live</Code> and <Code>/api/live/stream</Code>. Full details in{" "}
              <Code>supabase/README.md</Code>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
