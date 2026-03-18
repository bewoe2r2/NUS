"use client";

export function CaregiverIndicator() {
  return (
    <div className="flex items-center justify-center gap-1.5 text-xs text-success-600 font-medium py-2">
      <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
      Care team connected
    </div>
  );
}
