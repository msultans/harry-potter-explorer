import type { HouseName, HouseSlug } from "./types";

export interface House {
  slug: HouseSlug;
  name: HouseName;
  founder: string;
  animal: string;
  element: string;
  /** Hex colours: [primary, secondary]. */
  colors: [string, string];
  colorNames: string;
  traits: string[];
  ghost: string;
  headOfHouse: string;
  commonRoom: string;
  emblem: string;
  motto: string;
  description: string;
}

export const HOUSES: House[] = [
  {
    slug: "gryffindor",
    name: "Gryffindor",
    founder: "Godric Gryffindor",
    animal: "Lion",
    element: "Fire",
    colors: ["#740001", "#D3A625"],
    colorNames: "Scarlet & Gold",
    traits: ["Courage", "Bravery", "Nerve", "Chivalry"],
    ghost: "Nearly Headless Nick",
    headOfHouse: "Minerva McGonagall",
    commonRoom: "Gryffindor Tower",
    emblem: "🦁",
    motto: "Where dwell the brave at heart",
    description:
      "Founded by Godric Gryffindor, this house prizes daring, nerve and chivalry above all. Its members are known for acting first and thinking later, for standing up to friends as well as enemies, and for a stubborn refusal to abandon those they love.",
  },
  {
    slug: "slytherin",
    name: "Slytherin",
    founder: "Salazar Slytherin",
    animal: "Serpent",
    element: "Water",
    colors: ["#1A472A", "#AAAAAA"],
    colorNames: "Green & Silver",
    traits: ["Ambition", "Cunning", "Leadership", "Resourcefulness"],
    ghost: "The Bloody Baron",
    headOfHouse: "Severus Snape",
    commonRoom: "The Dungeons, beneath the Black Lake",
    emblem: "🐍",
    motto: "Those cunning folk use any means to achieve their ends",
    description:
      "Salazar Slytherin valued ambition, cunning and a certain disregard for the rules. Slytherins are natural leaders and strategists who choose their friends carefully and play the long game — a house that has produced both the darkest wizards and the most unexpected heroes.",
  },
  {
    slug: "hufflepuff",
    name: "Hufflepuff",
    founder: "Helga Hufflepuff",
    animal: "Badger",
    element: "Earth",
    colors: ["#ECB939", "#372E29"],
    colorNames: "Yellow & Black",
    traits: ["Hard work", "Patience", "Loyalty", "Fair play"],
    ghost: "The Fat Friar",
    headOfHouse: "Pomona Sprout",
    commonRoom: "Beside the kitchens, in the basement",
    emblem: "🦡",
    motto: "Those patient Hufflepuffs are true and unafraid of toil",
    description:
      "Helga Hufflepuff took in everyone the other founders passed over and taught them that loyalty and honest toil are worth more than glory. Hufflepuffs are warm, fair and fiercely dependable — and, as Cedric Diggory proved, more than capable of greatness.",
  },
  {
    slug: "ravenclaw",
    name: "Ravenclaw",
    founder: "Rowena Ravenclaw",
    animal: "Eagle",
    element: "Air",
    colors: ["#0E1A40", "#946B2D"],
    colorNames: "Blue & Bronze",
    traits: ["Intelligence", "Wit", "Wisdom", "Creativity"],
    ghost: "The Grey Lady (Helena Ravenclaw)",
    headOfHouse: "Filius Flitwick",
    commonRoom: "Ravenclaw Tower",
    emblem: "🦅",
    motto: "Wit beyond measure is man's greatest treasure",
    description:
      "Rowena Ravenclaw sought students with sharp minds and curious spirits. Ravenclaws are inventive, eccentric and endlessly inquisitive — the house of Luna Lovegood and Garrick Ollivander, where the door to the common room opens only to those who answer a riddle.",
  },
];

export const HOUSE_BY_SLUG: Record<HouseSlug, House> = Object.fromEntries(
  HOUSES.map((h) => [h.slug, h]),
) as Record<HouseSlug, House>;

export const HOUSE_BY_NAME: Record<HouseName, House> = Object.fromEntries(
  HOUSES.map((h) => [h.name, h]),
) as Record<HouseName, House>;

export function isHouseSlug(value: string): value is HouseSlug {
  return value in HOUSE_BY_SLUG;
}

export function houseSlugFromName(name: string): HouseSlug | null {
  const slug = name.trim().toLowerCase();
  return isHouseSlug(slug) ? slug : null;
}

/** Returns the House for a character's `house` field, or null when unsorted. */
export function houseOf(name: string | null | undefined): House | null {
  if (!name) return null;
  return HOUSE_BY_NAME[name as HouseName] ?? null;
}

/**
 * Tailwind-friendly accent classes per house. Components can use these for
 * badges/borders so colours stay consistent across the app.
 */
export const HOUSE_STYLES: Record<
  HouseSlug | "none",
  { badge: string; ring: string; gradient: string; text: string }
> = {
  gryffindor: {
    badge: "bg-[#740001]/80 text-[#F6D77A] border-[#D3A625]/60",
    ring: "ring-[#D3A625]/60",
    gradient: "from-[#740001] to-[#3a0000]",
    text: "text-[#F6D77A]",
  },
  slytherin: {
    badge: "bg-[#1A472A]/80 text-[#CFCFCF] border-[#AAAAAA]/50",
    ring: "ring-[#AAAAAA]/50",
    gradient: "from-[#1A472A] to-[#0b2416]",
    text: "text-[#B9E4C9]",
  },
  hufflepuff: {
    badge: "bg-[#372E29]/80 text-[#F5D67A] border-[#ECB939]/60",
    ring: "ring-[#ECB939]/60",
    gradient: "from-[#8a6a1c] to-[#372E29]",
    text: "text-[#F5D67A]",
  },
  ravenclaw: {
    badge: "bg-[#0E1A40]/80 text-[#D9C39A] border-[#946B2D]/60",
    ring: "ring-[#946B2D]/60",
    gradient: "from-[#0E1A40] to-[#070d22]",
    text: "text-[#D9C39A]",
  },
  none: {
    badge: "bg-white/5 text-zinc-300 border-white/15",
    ring: "ring-white/20",
    gradient: "from-zinc-800 to-zinc-900",
    text: "text-zinc-300",
  },
};

export function houseStyle(name: string | null | undefined) {
  const h = houseOf(name);
  return HOUSE_STYLES[h ? h.slug : "none"];
}
