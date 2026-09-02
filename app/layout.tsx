import type { Metadata } from "next";
import { Cinzel, EB_Garamond } from "next/font/google";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Harry Potter Explorer",
    template: "%s · Harry Potter Explorer",
  },
  description:
    "Explore the wizarding world: Hogwarts houses, characters, spells and magical artifacts — powered by the Harry Potter API.",
  keywords: ["Harry Potter", "Hogwarts", "houses", "characters", "spells", "artifacts"],
  openGraph: {
    title: "Harry Potter Explorer",
    description: "Houses, characters, spells and artifacts of the wizarding world.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cinzel.variable} ${garamond.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-gold-500 focus:px-4 focus:py-2 focus:text-night-950"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
