/**
 * Curated magical artifacts. The Harry Potter API has no artifacts endpoint,
 * so this is hand-written canon from the seven novels — descriptions stay
 * spoiler-light and stick to what the books actually say.
 */

export type ArtifactCategory =
  | "Deathly Hallows"
  | "Horcruxes"
  | "Founders' relics"
  | "Hogwarts & everyday magic"
  | "Quidditch & travel";

export type Book =
  | "Harry Potter and the Philosopher's Stone"
  | "Harry Potter and the Chamber of Secrets"
  | "Harry Potter and the Prisoner of Azkaban"
  | "Harry Potter and the Goblet of Fire"
  | "Harry Potter and the Order of the Phoenix"
  | "Harry Potter and the Half-Blood Prince"
  | "Harry Potter and the Deathly Hallows";

export interface Artifact {
  slug: string;
  name: string;
  category: ArtifactCategory;
  /** Two or three accurate, spoiler-light sentences. */
  description: string;
  /** Notable owners or keepers, in rough chronological order. */
  owners: string[];
  /** The novel in which the object itself is first seen. */
  firstAppearance: Book;
  /** Emoji used as the card icon. */
  icon: string;
  /** Six-digit hex colour used to tint the icon and category marker. */
  accent: string;
}

/** Display order for category tabs and grouped sections. */
export const ARTIFACT_CATEGORIES: readonly ArtifactCategory[] = [
  "Deathly Hallows",
  "Horcruxes",
  "Founders' relics",
  "Hogwarts & everyday magic",
  "Quidditch & travel",
];

/** One-line blurb shown under each category heading. */
export const ARTIFACT_CATEGORY_BLURBS: Record<ArtifactCategory, string> = {
  "Deathly Hallows": "Three objects from The Tale of the Three Brothers — together, said to make their master the master of Death.",
  Horcruxes: "Ordinary-looking treasures in which Tom Riddle hid fragments of his soul.",
  "Founders' relics": "Heirlooms of the four witches and wizards who built Hogwarts.",
  "Hogwarts & everyday magic": "Maps, mirrors, basins and trinkets from the castle and the wider wizarding world.",
  "Quidditch & travel": "Brooms, balls and other ways of getting somewhere — or somewhen — fast.",
};

export const ARTIFACTS: Artifact[] = [
  // ── Deathly Hallows ────────────────────────────────────────────────────
  {
    slug: "elder-wand",
    name: "Elder Wand",
    category: "Deathly Hallows",
    description:
      "The most powerful wand ever made, said in The Tale of the Three Brothers to have been fashioned by Death from a branch of elder. It passes from wizard to wizard by conquest, which gives it a long and bloody history — from Antioch Peverell through the wandmaker Gregorovitch to Gellert Grindelwald and, finally, Albus Dumbledore.",
    owners: ["Antioch Peverell", "Gregorovitch", "Gellert Grindelwald", "Albus Dumbledore"],
    firstAppearance: "Harry Potter and the Deathly Hallows",
    icon: "🪄",
    accent: "#d9c8a3",
  },
  {
    slug: "resurrection-stone",
    name: "Resurrection Stone",
    category: "Deathly Hallows",
    description:
      "A small, cracked black stone that calls back shades of the dead — present, but never truly alive, and never glad to be summoned. For generations it sat unrecognised in the Gaunt family ring, engraved with a symbol its owners mistook for the Peverell coat of arms.",
    owners: ["Cadmus Peverell", "Marvolo Gaunt", "Tom Riddle", "Albus Dumbledore"],
    firstAppearance: "Harry Potter and the Half-Blood Prince",
    icon: "🌑",
    accent: "#7d8aa3",
  },
  {
    slug: "cloak-of-invisibility",
    name: "Cloak of Invisibility",
    category: "Deathly Hallows",
    description:
      "A true Invisibility Cloak, fluid as water and silver-grey, that never fades, tears or wears thin with age. Handed down the Peverell line to the Potters, it was lent to Dumbledore by James and returned to Harry anonymously on his first Christmas at Hogwarts.",
    owners: ["Ignotus Peverell", "James Potter", "Harry Potter"],
    firstAppearance: "Harry Potter and the Philosopher's Stone",
    icon: "🧥",
    accent: "#b8c4d6",
  },

  // ── Horcruxes ──────────────────────────────────────────────────────────
  {
    slug: "tom-riddles-diary",
    name: "Tom Riddle's Diary",
    category: "Horcruxes",
    description:
      "A shabby Muggle diary with blank pages that writes back to whoever confides in it, preserving the memory of sixteen-year-old Tom Riddle. Lucius Malfoy slipped it into Ginny Weasley's cauldron at Flourish and Blotts, and by the end of the year the Chamber of Secrets had been opened again.",
    owners: ["Tom Riddle", "Lucius Malfoy", "Ginny Weasley"],
    firstAppearance: "Harry Potter and the Chamber of Secrets",
    icon: "📓",
    accent: "#5b74a8",
  },
  {
    slug: "marvolo-gaunts-ring",
    name: "Marvolo Gaunt's Ring",
    category: "Horcruxes",
    description:
      "A heavy gold ring set with a black stone, an heirloom the Gaunts wore as proof of their descent from Salazar Slytherin. Tom Riddle took it from his uncle Morfin; Dumbledore later recovered it from the ruins of the Gaunt shack, at a terrible cost to his hand.",
    owners: ["Marvolo Gaunt", "Morfin Gaunt", "Tom Riddle", "Albus Dumbledore"],
    firstAppearance: "Harry Potter and the Half-Blood Prince",
    icon: "💍",
    accent: "#b08d57",
  },
  {
    slug: "slytherins-locket",
    name: "Salazar Slytherin's Locket",
    category: "Horcruxes",
    description:
      "A heavy gold locket bearing an ornate serpentine S picked out in green stones. Sold to Borgin and Burkes by Merope Gaunt and bought by the collector Hepzibah Smith, it turned up years later at Grimmauld Place — a locket none of the cleaners could open — and it weighs on the mood of anyone who wears it.",
    owners: ["Salazar Slytherin", "Merope Gaunt", "Hepzibah Smith", "Tom Riddle", "Regulus Black"],
    firstAppearance: "Harry Potter and the Order of the Phoenix",
    icon: "📿",
    accent: "#3a9a68",
  },
  {
    slug: "hufflepuffs-cup",
    name: "Helga Hufflepuff's Cup",
    category: "Horcruxes",
    description:
      "A small golden cup with two finely wrought handles and a badger engraved on its side, rumoured to carry healing powers of its own. Hepzibah Smith proudly showed it to a young Tom Riddle; decades later it lay locked in the Lestrange vault at Gringotts.",
    owners: ["Helga Hufflepuff", "Hepzibah Smith", "Tom Riddle", "Bellatrix Lestrange"],
    firstAppearance: "Harry Potter and the Half-Blood Prince",
    icon: "🏆",
    accent: "#ecb939",
  },
  {
    slug: "ravenclaws-diadem",
    name: "Rowena Ravenclaw's Diadem",
    category: "Horcruxes",
    description:
      "A delicate tiara said to grant wisdom to its wearer, lost for a thousand years after Rowena's daughter Helena stole it and hid it in an Albanian forest. Riddle coaxed its hiding place from the Grey Lady and tucked it away in the Room of Requirement, where Harry once used a discoloured tiara to mark a hiding place of his own.",
    owners: ["Rowena Ravenclaw", "Helena Ravenclaw", "Tom Riddle"],
    firstAppearance: "Harry Potter and the Half-Blood Prince",
    icon: "👑",
    accent: "#6b8be0",
  },

  // ── Founders' relics ───────────────────────────────────────────────────
  {
    slug: "sword-of-gryffindor",
    name: "Sword of Gryffindor",
    category: "Founders' relics",
    description:
      "Goblin-made silver set with rubies the size of eggs, forged for Godric Gryffindor by Ragnuk the First. It presents itself to any worthy Gryffindor in need — usually out of the Sorting Hat — and absorbs only that which makes it stronger, Basilisk venom included.",
    owners: ["Godric Gryffindor", "Hogwarts headmasters", "Harry Potter"],
    firstAppearance: "Harry Potter and the Chamber of Secrets",
    icon: "⚔️",
    accent: "#d3a625",
  },
  {
    slug: "sorting-hat",
    name: "Sorting Hat",
    category: "Founders' relics",
    description:
      "Godric Gryffindor's own patched, frayed and extremely dirty hat, given a mind by all four founders so it could go on sorting students after they were gone. It composes a new song every year, occasionally warns the school of danger, and knows a true Gryffindor when it sits on one.",
    owners: ["Godric Gryffindor", "Hogwarts School"],
    firstAppearance: "Harry Potter and the Philosopher's Stone",
    icon: "🎩",
    accent: "#9c7a4a",
  },

  // ── Hogwarts & everyday magic ──────────────────────────────────────────
  {
    slug: "marauders-map",
    name: "Marauder's Map",
    category: "Hogwarts & everyday magic",
    description:
      "A map of Hogwarts drawn by Messrs Moony, Wormtail, Padfoot and Prongs that shows every corridor, secret passage and person in the castle, moving in real time. It reveals itself to anyone who solemnly swears they are up to no good and goes blank again at “Mischief managed”.",
    owners: ["The Marauders", "Argus Filch", "Fred & George Weasley", "Harry Potter"],
    firstAppearance: "Harry Potter and the Prisoner of Azkaban",
    icon: "🗺️",
    accent: "#c9a86a",
  },
  {
    slug: "pensieve",
    name: "Pensieve",
    category: "Hogwarts & everyday magic",
    description:
      "A shallow stone basin carved with runes, filled with a bright, cloud-like substance that is neither liquid nor gas. Memories siphoned from the mind can be poured in and examined at leisure — or entered outright, which is how Harry gets his first unguarded look at the past.",
    owners: ["Albus Dumbledore", "Hogwarts headmasters"],
    firstAppearance: "Harry Potter and the Goblet of Fire",
    icon: "🌀",
    accent: "#8fb3d9",
  },
  {
    slug: "mirror-of-erised",
    name: "Mirror of Erised",
    category: "Hogwarts & everyday magic",
    description:
      "A magnificent gilt-framed mirror on two clawed feet, with an inscription that only makes sense read backwards. It shows not your face but the deepest desire of your heart; Dumbledore warns that men have wasted away before it, and later puts it to work guarding the Philosopher's Stone.",
    owners: ["Hogwarts School", "Albus Dumbledore"],
    firstAppearance: "Harry Potter and the Philosopher's Stone",
    icon: "🪞",
    accent: "#c4b7d9",
  },
  {
    slug: "philosophers-stone",
    name: "Philosopher's Stone",
    category: "Hogwarts & everyday magic",
    description:
      "A blood-red stone made by the alchemist Nicolas Flamel that turns any metal into pure gold and yields the Elixir of Life. In Harry's first year it was moved from Gringotts to Hogwarts and hidden behind a gauntlet of enchantments devised by the teachers.",
    owners: ["Nicolas Flamel", "Albus Dumbledore"],
    firstAppearance: "Harry Potter and the Philosopher's Stone",
    icon: "💎",
    accent: "#c0392b",
  },
  {
    slug: "deluminator",
    name: "Deluminator",
    category: "Hogwarts & everyday magic",
    description:
      "Dumbledore's silver Put-Outer, which looks like a cigarette lighter and plucks the light from every lamp in a street, returning it with a click. He used it to darken Privet Drive the night Harry was left on the Dursleys' doorstep, and left it to Ron Weasley in his will.",
    owners: ["Albus Dumbledore", "Ron Weasley"],
    firstAppearance: "Harry Potter and the Philosopher's Stone",
    icon: "🕯️",
    accent: "#a3a9b8",
  },
  {
    slug: "remembrall",
    name: "Remembrall",
    category: "Hogwarts & everyday magic",
    description:
      "A glass ball the size of a large marble, full of white smoke that glows scarlet when its holder has forgotten something. Neville's gran sent him one by owl at breakfast — the trouble being, as he admitted, that he couldn't remember what he'd forgotten.",
    owners: ["Neville Longbottom"],
    firstAppearance: "Harry Potter and the Philosopher's Stone",
    icon: "🔮",
    accent: "#e06c75",
  },
  {
    slug: "goblet-of-fire",
    name: "Goblet of Fire",
    category: "Hogwarts & everyday magic",
    description:
      "A large, roughly hewn wooden cup brimming with dancing blue-white flames, kept in a jewelled casket and unveiled to choose each school's champion for the Triwizard Tournament. An impartial judge whose choice is a binding magical contract — which is why a fourth name caused such an uproar.",
    owners: ["Ministry of Magic", "Hogwarts School"],
    firstAppearance: "Harry Potter and the Goblet of Fire",
    icon: "🔥",
    accent: "#4f9cf7",
  },
  {
    slug: "two-way-mirror",
    name: "Two-way Mirror",
    category: "Hogwarts & everyday magic",
    description:
      "One of a pair of small square mirrors: speak the other owner's name into yours and they appear in the glass. James and Sirius used them to talk during separate detentions, and Sirius gave Harry his in a package Harry didn't open until it was far too late.",
    owners: ["James Potter", "Sirius Black", "Harry Potter", "Aberforth Dumbledore"],
    firstAppearance: "Harry Potter and the Order of the Phoenix",
    icon: "👁️",
    accent: "#7fa6c9",
  },

  // ── Quidditch & travel ─────────────────────────────────────────────────
  {
    slug: "golden-snitch",
    name: "Golden Snitch",
    category: "Quidditch & travel",
    description:
      "A walnut-sized golden ball with fluttering silver wings, released last in every Quidditch match. Catching it ends the game and earns a hundred and fifty points, and every Snitch carries a flesh memory of the first person to touch it — a detail Dumbledore would one day put to use.",
    owners: ["Hogwarts Quidditch stores", "Harry Potter"],
    firstAppearance: "Harry Potter and the Philosopher's Stone",
    icon: "✨",
    accent: "#f0dc9a",
  },
  {
    slug: "nimbus-2000",
    name: "Nimbus 2000",
    category: "Quidditch & travel",
    description:
      "The fastest racing broom of its day, with a sleek mahogany handle, a tail of neat straight twigs and its name written in gold near the top. Professor McGonagall arranged one for Harry in his first year, making him the youngest house Quidditch player in a century.",
    owners: ["Harry Potter"],
    firstAppearance: "Harry Potter and the Philosopher's Stone",
    icon: "🧹",
    accent: "#a8683a",
  },
  {
    slug: "firebolt",
    name: "Firebolt",
    category: "Quidditch & travel",
    description:
      "An international-standard racing broom with a superfine ash handle and hand-selected birch twigs, accelerating from nought to a hundred and fifty miles an hour in ten seconds. It arrived for Harry anonymously one Christmas — and was promptly confiscated for testing — before carrying him through the Triwizard Tournament's first task.",
    owners: ["Sirius Black", "Harry Potter"],
    firstAppearance: "Harry Potter and the Prisoner of Azkaban",
    icon: "☄️",
    accent: "#e25822",
  },
  {
    slug: "time-turner",
    name: "Time-Turner",
    category: "Quidditch & travel",
    description:
      "A tiny hourglass on a long gold chain that carries its wearer back one hour for every turn. The Ministry issued one to Hermione, with Professor McGonagall's backing, so she could attend every elective at once — and the Ministry's entire stock was later smashed in the Department of Mysteries.",
    owners: ["Ministry of Magic", "Hermione Granger"],
    firstAppearance: "Harry Potter and the Prisoner of Azkaban",
    icon: "⏳",
    accent: "#d4a24a",
  },
];
