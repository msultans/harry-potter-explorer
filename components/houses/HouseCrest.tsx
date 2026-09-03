import type { House } from "@/lib/houses";
import { cn } from "@/lib/utils";

interface CrestProps {
  house: House;
  /** Rendered width in px. The shield is 5:6, so the height is size × 1.2. */
  size?: number;
  className?: string;
}

/* Heraldic shield in a 100 × 120 box; both halves share the centre line, so no <defs> ids are needed. */
const SHIELD = "M50 5 L91 17 V58 C91 86 72 105 50 115 C28 105 9 86 9 58 V17 Z";
const LEFT_HALF = "M50 5 L9 17 V58 C9 86 28 105 50 115 Z";
const RIGHT_HALF = "M50 5 L91 17 V58 C91 86 72 105 50 115 Z";
const SHEEN = "M50 5 L9 17 V58 Z";

/**
 * Decorative shield crest for a house: split per pale in its two colours with
 * the emblem centred. Purely presentational and always hidden from assistive tech.
 */
export function HouseCrest({ house, size = 96, className }: CrestProps) {
  const [primary, secondary] = house.colors;
  const glyph = house.emblem || house.name.charAt(0);

  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={Math.round(size * 1.2)}
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <path d={LEFT_HALF} fill={primary} />
      <path d={RIGHT_HALF} fill={secondary} />
      <path d={SHEEN} fill="rgba(255,255,255,0.10)" />
      <path d={SHIELD} fill="none" stroke="#F0DC9A" strokeWidth="2.5" strokeLinejoin="round" />
      <g transform="translate(50 60) scale(0.86) translate(-50 -60)">
        <path d={SHIELD} fill="none" stroke="rgba(247,236,196,0.35)" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <circle cx="50" cy="60" r="21" fill="rgba(4,5,12,0.45)" />
      <text
        x="50"
        y="60"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={house.emblem ? 30 : 34}
        fontFamily="var(--font-display), serif"
        fontWeight={700}
        fill="#F7ECC4"
      >
        {glyph}
      </text>
    </svg>
  );
}

interface SwatchProps {
  house: House;
  className?: string;
}

/** Two small colour swatches plus the colour names, with a hidden label for screen readers. */
export function HouseColorSwatches({ house, className }: SwatchProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="sr-only">House colours:</span>
      <span aria-hidden className="inline-flex gap-1">
        {house.colors.map((hex) => (
          <span
            key={hex}
            className="h-4 w-4 rounded-md border border-white/25 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25)]"
            style={{ backgroundColor: hex }}
          />
        ))}
      </span>
      <span>{house.colorNames}</span>
    </span>
  );
}
