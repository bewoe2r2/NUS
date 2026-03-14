"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Cpu, Target, Play, Presentation, MonitorPlay } from "lucide-react";

const links = [
  { href: "/", label: "Overview", icon: Heart },
  { href: "/impact", label: "Blue Ocean", icon: Target },
  { href: "/demo", label: "Product", icon: Play },
  { href: "/technology", label: "Technology", icon: Cpu },
  { href: "/pitch", label: "Pitch", icon: Presentation },
  { href: "/present", label: "Present", icon: MonitorPlay },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-surface/80 border-b border-border-subtle">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary-glow">
            <Heart size={16} className="text-white" />
          </span>
          <div className="flex flex-col">
            <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-ink leading-none">
              BEWO
            </span>
            <span className="text-[9px] text-ink-muted tracking-[0.15em] uppercase mt-0.5">
              Predictive Care
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`
                  relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-primary-muted text-primary"
                      : "text-ink-muted hover:text-ink hover:bg-surface-raised"
                  }
                `}
              >
                <Icon size={15} />
                {label}
                {isActive && (
                  <span className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-6 h-[2px] bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
