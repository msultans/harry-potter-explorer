import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { LiveFeed } from "@/components/live/LiveFeed";
import { SetupNotice } from "@/components/live/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * /live: favourites from every visitor, streamed from Supabase through our
 * own Server-Sent Events endpoint. When Supabase is not configured the page
 * explains how to switch the feature on instead of erroring.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Feed",
  description: "Favourites from every visitor, streamed live from Supabase.",
};

export default function LivePage() {
  const configured = isSupabaseConfigured();

  return (
    <>
      <PageHeader
        eyebrow="Real-time"
        title="Live Feed"
        description="Favourites from every visitor, streamed live from Supabase"
      />
      <section className="container-page pb-16" aria-label="Live favourites">
        {configured ? <LiveFeed /> : <SetupNotice />}
      </section>
    </>
  );
}
