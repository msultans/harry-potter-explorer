import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow mb-3">Error 404</p>
      <h1 className="heading-lg">Lost in the Forbidden Forest</h1>
      <p className="mt-4 max-w-md text-muted">
        The page you are looking for has vanished — perhaps under an Invisibility Cloak. Let’s get you back to the castle.
      </p>
      <Link href="/" className="btn-gold mt-8">
        Return to Hogwarts
      </Link>
    </div>
  );
}
