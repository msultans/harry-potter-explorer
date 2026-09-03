import type { Metadata } from "next";
import { HouseCard } from "@/components/houses/HouseCard";
import { PageHeader } from "@/components/PageHeader";
import { HOUSES } from "@/lib/houses";

export const metadata: Metadata = {
  title: "Houses",
  description:
    "Gryffindor, Slytherin, Hufflepuff and Ravenclaw — the founders, colours, symbols and virtues of the four Hogwarts houses.",
};

export default function HousesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Hogwarts"
        title="The Four Houses"
        description="Every first-year is sorted into one of four houses, each bearing its founder's virtues, colours and creature. Explore what sets them apart — and who was sorted where."
      />
      <section aria-label="Hogwarts houses" className="container-page pb-16">
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {HOUSES.map((house, i) => (
            <li key={house.slug} className="animate-fade-up" style={{ animationDelay: `${i * 90}ms` }}>
              <HouseCard house={house} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
