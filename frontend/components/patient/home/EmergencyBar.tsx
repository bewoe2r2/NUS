"use client";

import { Phone } from "lucide-react";

interface EmergencyBarProps {
  state: "STABLE" | "WARNING" | "CRISIS" | string;
}

export function EmergencyBar({ state }: EmergencyBarProps) {
  if (state === "STABLE") return null;

  const isWarning = state === "WARNING";

  return (
    <div
      className={`w-full px-6 py-3 text-sm font-medium flex items-center justify-between gap-3 ${
        isWarning
          ? "bg-warning-bg text-warning-700 border-b border-warning-200"
          : "bg-error-bg text-error-700 border-b border-error-200"
      }`}
    >
      <span>
        {isWarning
          ? "We\u2019re keeping a close eye on you. Your care team has been notified. If you feel unwell, call your nurse hotline."
          : "Help is on the way. If you need immediate assistance, call 995."}
      </span>
      {!isWarning && (
        <a
          href="tel:995"
          className="shrink-0 flex items-center gap-1.5 bg-error-500 text-white px-4 py-2 rounded-full text-xs font-bold active:scale-95 transition-transform"
        >
          <Phone size={14} />
          Call 995
        </a>
      )}
    </div>
  );
}
