import { PageHeader } from "@/components/PageHeader";
import { CatalogSkeleton } from "@/components/characters/CatalogSkeleton";

export default function Loading() {
  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Characters"
        description="Search the whole archive by name, filter by house and pin your favourites."
      />
      <div className="container-page pb-16">
        <CatalogSkeleton />
      </div>
    </>
  );
}
