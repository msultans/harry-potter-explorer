import Link from "next/link";
import { FavoriteButton } from "@/components/FavoriteButton";
import { houseOf, houseStyle } from "@/lib/houses";
import { cn, describeWand, formatDateOfBirth, titleCase } from "@/lib/utils";
import type { Character } from "@/lib/types";
import { FactGrid, type Fact } from "./FactGrid";
import { Portrait } from "./Portrait";

interface Props {
  character: Character;
}

interface StatusChip {
  label: string;
  className: string;
}

function bornLabel(c: Character): string {
  if (c.dateOfBirth) return formatDateOfBirth(c.dateOfBirth);
  return c.yearOfBirth ? String(c.yearOfBirth) : "";
}

function hogwartsRole(c: Character): "Student" | "Staff" | "" {
  if (c.hogwartsStudent) return "Student";
  if (c.hogwartsStaff) return "Staff";
  return "";
}

/** "Wizard", or the species for non-humans, or "Muggle" for non-magical humans. */
function magicLabel(c: Character): string {
  if (c.wizard) return "Wizard";
  const species = c.species.trim().toLowerCase();
  if (!species) return "";
  return species === "human" ? "Muggle" : titleCase(c.species);
}

function buildStatusChips(c: Character): StatusChip[] {
  const chips: StatusChip[] = [
    c.alive
      ? { label: "Alive", className: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" }
      : { label: "Deceased", className: "border-white/15 bg-white/5 text-zinc-300" },
  ];
  const role = hogwartsRole(c);
  if (role) chips.push({ label: role, className: "border-gold-500/40 bg-gold-500/10 text-gold-200" });
  const magic = magicLabel(c);
  if (magic) chips.push({ label: magic, className: "border-sky-400/30 bg-sky-500/10 text-sky-100" });
  return chips;
}

function buildFacts(c: Character): Fact[] {
  const role = hogwartsRole(c);
  const cast = [c.actor, ...c.alternate_actors].map((a) => a.trim()).filter(Boolean);
  return [
    { label: "Species", value: titleCase(c.species) },
    { label: "Gender", value: titleCase(c.gender) },
    { label: "Ancestry", value: titleCase(c.ancestry) },
    { label: "Born", value: bornLabel(c) },
    { label: "Eye colour", value: titleCase(c.eyeColour) },
    { label: "Hair colour", value: titleCase(c.hairColour) },
    { label: "Wand", value: describeWand(c.wand) },
    { label: "Patronus", value: c.patronus ? titleCase(c.patronus) : "None recorded" },
    { label: "Hogwarts", value: role || "—" },
    { label: "Portrayed by", value: cast.join(", ") },
  ];
}

/**
 * Hero block of the character page: portrait on the left, identity and
 * facts on the right (stacked on small screens). Server component; the
 * favorite heart is its own client island.
 */
export function CharacterDetail({ character }: Props) {
  const house = houseOf(character.house);
  const style = houseStyle(character.house);
  const chips = buildStatusChips(character);
  const facts = buildFacts(character);

  return (
    <article className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-5 lg:self-start lg:sticky lg:top-24">
        <Portrait character={character} className="mx-auto w-full max-w-sm animate-fade-up lg:max-w-none" />
      </div>

      <div className="min-w-0 lg:col-span-7">
        <div className="animate-fade-up">
          {house ? (
            <Link
              href={`/houses/${house.slug}`}
              className={cn("chip px-3 py-1 text-sm transition-colors hover:brightness-125", style.badge)}
              aria-label={`${house.name} house`}
            >
              <span aria-hidden>{house.emblem}</span> {house.name}
            </Link>
          ) : (
            <span className={cn("chip px-3 py-1 text-sm", style.badge)}>Unsorted</span>
          )}

          <h1 className="heading-xl mt-4 text-balance lg:text-5xl">{character.name}</h1>

          {character.alternate_names.length > 0 && (
            <p className="mt-3 italic text-muted">
              also known as {character.alternate_names.join(", ")}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
            <FavoriteButton character={character} size="lg" withLabel />
            <ul aria-label="Status" className="flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <li key={chip.label}>
                  <span className={cn("chip px-3 py-1 text-sm", chip.className)}>{chip.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divider" aria-hidden>
          <span className="text-sm">✦</span>
        </div>

        <section aria-labelledby="character-facts-heading">
          <h2 id="character-facts-heading" className="eyebrow mb-4">
            From the records
          </h2>
          <FactGrid facts={facts} />
        </section>
      </div>
    </article>
  );
}
