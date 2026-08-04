"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-4xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-gray-500">A critical error occurred. Please try again.</p>
        {error.digest && <p className="text-xs text-gray-400">Error ID: {error.digest}</p>}
        <button
          onClick={() => unstable_retry()}
          className="mt-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
