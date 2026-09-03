import { cn } from "@/lib/utils";

export interface Fact {
  label: string;
  /** Empty / whitespace-only values are omitted from the grid. */
  value: string;
}

interface Props {
  facts: Fact[];
  className?: string;
}

/**
 * Definition-list grid of character facts. Renders a hairline-separated
 * two-column grid on sm+ and stacks on mobile.
 */
export function FactGrid({ facts, className }: Props) {
  const visible = facts.filter((f) => f.value.trim().length > 0);

  if (visible.length === 0) {
    return (
      <p className={cn("card px-5 py-4 italic text-muted", className)}>
        The archives hold no further details about this character.
      </p>
    );
  }

  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2",
        className,
      )}
    >
      {visible.map((fact) => (
        <div key={fact.label} className="bg-night-900/85 px-5 py-4 backdrop-blur-sm">
          <dt className="eyebrow text-[11px]">{fact.label}</dt>
          <dd className="mt-1 text-lg leading-snug text-parchment">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
