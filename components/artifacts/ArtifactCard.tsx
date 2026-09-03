import type { Artifact } from "@/lib/artifacts";

interface Props {
  artifact: Artifact;
}

/**
 * Presentational card for one artifact. Server-compatible (no hooks); the
 * gallery renders it inside a client island so the tabs can filter.
 * The per-item accent colour is applied inline — it is data, not a theme token.
 */
export function ArtifactCard({ artifact }: Props) {
  const { icon, accent, name, category, description, owners, firstAppearance } = artifact;

  return (
    <article className="card card-hover flex h-full flex-col p-5">
      <div className="flex items-start gap-4">
        <div
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border text-3xl leading-none"
          style={{
            backgroundColor: `${accent}22`,
            borderColor: `${accent}66`,
            boxShadow: `0 0 32px -10px ${accent}aa`,
          }}
        >
          {icon}
        </div>
        <div className="min-w-0 pt-0.5">
          <h3 className="font-display text-lg font-semibold leading-snug text-gold-200">{name}</h3>
          <span className="chip mt-2 border-white/15 bg-white/5 text-parchment-dim">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
            {category}
          </span>
        </div>
      </div>

      <p className="mt-4 text-[0.95rem] leading-relaxed text-parchment/90">{description}</p>

      <dl className="mt-auto space-y-1.5 border-t border-white/10 pt-4 text-sm">
        <div className="flex gap-2">
          <dt className="shrink-0 text-gold-500">Owners</dt>
          <dd className="text-muted">{owners.join(" · ")}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 text-gold-500">First seen in</dt>
          <dd className="italic text-muted">{firstAppearance}</dd>
        </div>
      </dl>
    </article>
  );
}
