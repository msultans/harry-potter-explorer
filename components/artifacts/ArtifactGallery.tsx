"use client";

import { useMemo, useState } from "react";
import { ArtifactCard } from "@/components/artifacts/ArtifactCard";
import { ARTIFACT_CATEGORIES, ARTIFACT_CATEGORY_BLURBS, type Artifact, type ArtifactCategory } from "@/lib/artifacts";
import { cn } from "@/lib/utils";

interface Props {
  artifacts: Artifact[];
}

type Filter = "All" | ArtifactCategory;

interface Group {
  category: ArtifactCategory;
  anchor: string;
  items: Artifact[];
}

function anchorFor(category: ArtifactCategory): string {
  return `artifacts-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

/** Category tabs over a grouped grid. Local state only — no URL round trip needed for 22 items. */
export function ArtifactGallery({ artifacts }: Props) {
  const [filter, setFilter] = useState<Filter>("All");

  const groups = useMemo<Group[]>(
    () =>
      ARTIFACT_CATEGORIES.map((category) => ({
        category,
        anchor: anchorFor(category),
        items: artifacts.filter((a) => a.category === category),
      })).filter((g) => g.items.length > 0),
    [artifacts],
  );

  const visible = filter === "All" ? groups : groups.filter((g) => g.category === filter);
  const shown = visible.reduce((n, g) => n + g.items.length, 0);

  const tabs: Array<{ label: Filter; count: number }> = [
    { label: "All", count: artifacts.length },
    ...groups.map((g) => ({ label: g.category, count: g.items.length })),
  ];

  if (artifacts.length === 0) {
    return (
      <div className="container-page pb-20">
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <span aria-hidden className="animate-float text-4xl">🚪</span>
          <h2 className="heading-lg mt-4 text-2xl sm:text-3xl">The Room is empty</h2>
          <p className="mt-2 max-w-md text-muted">No artifacts have been catalogued yet. Check back once the Room of Requirement is stocked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page pb-20">
      <div role="group" aria-label="Filter artifacts by category" className="flex flex-wrap gap-2">
        {tabs.map(({ label, count }) => {
          const active = filter === label;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(label)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm tracking-wide transition-colors",
                active
                  ? "border-gold-500/70 bg-gold-500/15 text-gold-200 shadow-glow"
                  : "border-white/15 text-parchment-dim hover:border-gold-500/40 hover:bg-white/5 hover:text-parchment",
              )}
            >
              {label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                  active ? "bg-gold-500 text-night-950" : "bg-white/10 text-parchment-dim",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <p role="status" aria-live="polite" className="mt-4 text-sm text-muted">
        Showing {shown} {shown === 1 ? "artifact" : "artifacts"}
        {filter === "All" ? ` across ${visible.length} categories` : ` in ${filter}`}
      </p>

      <div key={filter} className="animate-fade-up">
        {visible.map((group) => (
          <section key={group.category} id={group.anchor} aria-labelledby={`${group.anchor}-heading`} className="mt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-gold-600/30 pb-3">
              <h2 id={`${group.anchor}-heading`} className="font-display text-2xl font-semibold text-gold-200 sm:text-3xl">
                {group.category}
                <span className="ml-3 align-middle text-sm font-normal tracking-wide text-parchment-dim">
                  {group.items.length}
                </span>
              </h2>
              <p className="max-w-xl text-sm text-muted">{ARTIFACT_CATEGORY_BLURBS[group.category]}</p>
            </div>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((artifact) => (
                <li key={artifact.slug}>
                  <ArtifactCard artifact={artifact} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
