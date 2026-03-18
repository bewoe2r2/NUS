"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Something went wrong</h2>
        <p className="text-neutral-600 text-sm">An unexpected error occurred. Please try again.</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm hover:bg-neutral-800 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
