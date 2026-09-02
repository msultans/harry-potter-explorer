import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 py-8 text-sm text-parchment-dim">
      <div className="container-page flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p>
          <span className="font-display tracking-wider text-gold-500">Harry Potter Explorer</span> — a fan project.
          Data from the{" "}
          <a
            href="https://hp-api.onrender.com/"
            target="_blank"
            rel="noreferrer noopener"
            className="underline decoration-gold-600/60 underline-offset-4 hover:text-parchment"
          >
            Harry Potter API
          </a>
          , fetched server-side.
        </p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/houses" className="hover:text-parchment">Houses</Link>
          <Link href="/characters" className="hover:text-parchment">Characters</Link>
          <Link href="/spells" className="hover:text-parchment">Spells</Link>
        </nav>
      </div>
    </footer>
  );
}
