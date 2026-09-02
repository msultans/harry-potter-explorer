/** Small shared helpers (no React, safe on server and client). */

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** hp-api dates are "DD-MM-YYYY". Returns e.g. "31 July 1980"; falls back to the input. */
export function formatDateOfBirth(dob: string | null | undefined): string {
  if (!dob) return "";
  const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(dob);
  if (!m) return dob;
  const day = Number(m[1]);
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${day} ${month} ${m[3]}` : dob;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function titleCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** "holly, phoenix tail feather, 11″" — or "Unknown" when nothing is recorded. */
export function describeWand(wand: { wood: string; core: string; length: number | null }): string {
  const parts = [wand.wood, wand.core, wand.length ? `${wand.length}″` : ""].filter(Boolean);
  return parts.length ? parts.map(titleCase).join(" · ") : "Unknown";
}
