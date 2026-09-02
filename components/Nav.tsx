"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/lib/favorites";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/houses", label: "Houses" },
  { href: "/characters", label: "Characters" },
  { href: "/spells", label: "Spells" },
  { href: "/artifacts", label: "Artifacts" },
  { href: "/live", label: "Live" },
] as const;

export function Nav() {
  const pathname = usePathname();
  // The menu remembers the path it was opened on, so it closes itself on navigation
  // without an effect.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const { favorites, hydrated } = useFavorites();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-night-950/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2" aria-label="Harry Potter Explorer — home">
          <span aria-hidden className="text-2xl transition-transform group-hover:rotate-12">⚡</span>
          <span className="font-display text-base font-semibold tracking-wider text-gold-300 sm:text-lg">
            Harry Potter <span className="text-parchment">Explorer</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm tracking-wide transition-colors",
                isActive(l.href)
                  ? "bg-gold-500/15 text-gold-200"
                  : "text-parchment-dim hover:bg-white/5 hover:text-parchment",
              )}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/favorites"
            aria-current={isActive("/favorites") ? "page" : undefined}
            className={cn(
              "ml-1 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm tracking-wide transition-colors",
              isActive("/favorites")
                ? "border-gold-500/60 bg-gold-500/15 text-gold-200"
                : "border-white/10 text-parchment-dim hover:border-gold-500/40 hover:text-parchment",
            )}
          >
            <span aria-hidden>♥</span>
            Favorites
            {hydrated && favorites.length > 0 && (
              <span className="rounded-full bg-gold-500 px-1.5 text-[11px] font-bold text-night-950">
                {favorites.length}
              </span>
            )}
          </Link>
        </nav>

        <button
          type="button"
          className="btn-ghost md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpenAt(open ? null : pathname)}
        >
          <span className="sr-only">Toggle navigation</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-white/10 md:hidden">
          <div className="container-page flex flex-col py-2">
            {[...LINKS, { href: "/favorites", label: "♥ Favorites" }].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-base",
                  isActive(l.href) ? "bg-gold-500/15 text-gold-200" : "text-parchment-dim hover:bg-white/5",
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
