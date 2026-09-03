import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { FavoritesList } from "@/components/favorites/FavoritesList";

export const metadata: Metadata = {
  title: "Favorites",
  description: "Characters you've marked with a heart — kept in this browser's localStorage.",
};

/**
 * Favorites live entirely in the browser (localStorage), so this page is a thin
 * server shell around a client list. Nothing here touches the upstream API.
 */
export default function FavoritesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Your collection"
        title="Favorites"
        description="Characters you've marked with a heart. Stored in this browser only (localStorage)."
      />
      <section className="container-page pb-16 sm:pb-24" aria-label="Favourite characters">
        <FavoritesList />
      </section>
    </>
  );
}
