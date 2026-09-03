"use client";

import { HOUSES, houseStyle } from "@/lib/houses";
import { cn } from "@/lib/utils";
import type { HouseSlug } from "@/lib/types";

interface Props {
  value: HouseSlug | "";
  onChange: (value: HouseSlug | "") => void;
  className?: string;
}

const CHIP =
  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium tracking-wide transition-all duration-200";
const IDLE = "border-white/15 text-parchment-dim hover:border-gold-500/40 hover:bg-white/5 hover:text-parchment";

/** "All" + the four houses as toggle chips; exactly one is pressed at a time. */
export function HouseFilter({ value, onChange, className }: Props) {
  return (
    <div role="group" aria-label="Filter by house" className={cn("flex flex-wrap gap-2", className)}>
      <button
        type="button"
        aria-pressed={value === ""}
        onClick={() => onChange("")}
        className={cn(CHIP, value === "" ? "border-gold-500/70 bg-gold-500/15 text-gold-200 shadow-glow" : IDLE)}
      >
        <span aria-hidden>✦</span> All
      </button>
      {HOUSES.map((house) => {
        const selected = value === house.slug;
        const style = houseStyle(house.name);
        return (
          <button
            key={house.slug}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(house.slug)}
            className={cn(CHIP, selected ? cn(style.badge, "ring-2", style.ring) : IDLE)}
          >
            <span aria-hidden>{house.emblem}</span> {house.name}
          </button>
        );
      })}
    </div>
  );
}
