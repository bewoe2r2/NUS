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
    console.error("Caregiver dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-stone-50">
      <div className="text-center space-y-4">
        <div className="text-4xl">&#128150;</div>
        <h2 className="text-xl font-semibold text-stone-900">
          Something went wrong
        </h2>
        <p className="text-stone-600 text-sm max-w-xs mx-auto">
          We could not load your father&apos;s dashboard. This is usually temporary.
        </p>
        <p className="text-stone-400 text-xs">{error.message}</p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
