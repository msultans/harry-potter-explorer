"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow mb-3">Something went wrong</p>
      <h1 className="heading-lg">A spell backfired</h1>
      <p className="mt-4 max-w-md text-muted">
        We couldn’t load this page. The Harry Potter API may be waking up — it can take a moment on first request.
      </p>
      <button type="button" onClick={() => retry()} className="btn-gold mt-8">
        Try again
      </button>
    </div>
  );
}
