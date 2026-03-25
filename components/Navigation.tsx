"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/discover", label: "Discover", icon: "🔥" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/my-picks", label: "My Picks", icon: "⭐" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
        <ul className="mx-auto grid h-16 max-w-3xl grid-cols-3 gap-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <li key={tab.href} className="h-full">
                <Link
                  href={tab.href}
                  className={cn(
                    "flex h-full min-h-12 w-full flex-col items-center justify-center rounded-xl px-2 text-xs font-semibold",
                    active
                      ? "bg-accent/20 text-text-primary"
                      : "text-text-secondary"
                  )}
                >
                  <span aria-hidden>{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav className="hidden border-b border-border bg-background/90 backdrop-blur lg:block">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold text-text-primary">
            Pitchr
          </Link>
          <ul className="flex items-center gap-2">
            {tabs.map((tab) => {
              const active = pathname === tab.href;
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-medium",
                      active
                        ? "bg-accent/20 text-text-primary"
                        : "text-text-secondary"
                    )}
                  >
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
}
