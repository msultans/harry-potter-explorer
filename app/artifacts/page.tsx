import type { Metadata } from "next";
import { ArtifactGallery } from "@/components/artifacts/ArtifactGallery";
import { PageHeader } from "@/components/PageHeader";
import { ARTIFACT_CATEGORIES, ARTIFACTS } from "@/lib/artifacts";

export const metadata: Metadata = {
  title: "Artifacts",
  description:
    "The Deathly Hallows, the Horcruxes, the founders' relics and the everyday enchanted objects of the wizarding world — who owned them and where they first appear.",
};

/** Fully static: the data is curated locally, so there is nothing to fetch. */
export default function ArtifactsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Room of Requirement"
        title="Magical Artifacts"
        description={`${ARTIFACTS.length} legendary objects in ${ARTIFACT_CATEGORIES.length} collections — wands and cloaks, hidden Horcruxes, founders' heirlooms and the trinkets of castle life — each with its keepers and the book where it first appears.`}
      />
      <ArtifactGallery artifacts={ARTIFACTS} />
    </>
  );
}
