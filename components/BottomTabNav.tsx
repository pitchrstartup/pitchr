"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/discover", label: "Discover" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/backed", label: "Backed" },
];

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface md:hidden">
      <ul className="mx-auto grid h-16 max-w-5xl grid-cols-3 px-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href} className="flex">
              <Link
                href={tab.href}
                className={`flex min-h-12 w-full items-center justify-center rounded-button text-sm ${
                  active
                    ? "bg-green-50 font-medium text-back-strong"
                    : "font-normal text-gray-400 hover:text-text-primary"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
