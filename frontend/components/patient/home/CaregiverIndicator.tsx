"use client";

export function CaregiverIndicator() {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-success-600 font-medium py-3 px-4 bg-success-50/50 rounded-full border border-success-100/50 mx-auto w-fit">
      <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
      Care team connected
    </div>
  );
}
