import type { Metadata } from "next";
import { Suspense } from "react";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { Hero } from "@/components/home/Hero";
import { HouseStrip } from "@/components/home/HouseStrip";
import { Stats, StatsSkeleton } from "@/components/home/Stats";

/** The stats band pulls from hp-api; everything else on this page is static. */
export const revalidate = 3600;

export const metadata: Metadata = {
  // The layout template does not apply to a page in the same (root) segment, so spell the title out.
  title: { absolute: "Home · Harry Potter Explorer" },
  description:
    "Step into the wizarding world: explore the Hogwarts houses, search hundreds of characters, and browse spells and legendary artifacts.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>
      <HouseStrip />
      <FeatureGrid />
    </>
  );
}
