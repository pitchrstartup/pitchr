import Link from "next/link";
import { BottomTabNav } from "@/components/BottomTabNav";

export function Navigation() {
  return (
    <>
      <nav className="hidden border-b border-border bg-surface md:block">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
          <Link href="/discover" className="text-lg font-medium tracking-[-0.03em] text-text-primary">
            Pitchr
          </Link>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Link href="/discover" className="rounded-button px-3 py-2 hover:bg-gray-100 hover:text-text-primary">
              Discover
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-button px-3 py-2 hover:bg-gray-100 hover:text-text-primary"
            >
              Leaderboard
            </Link>
            <Link href="/backed" className="rounded-button px-3 py-2 hover:bg-gray-100 hover:text-text-primary">
              Backed
            </Link>
          </div>
        </div>
      </nav>
      <BottomTabNav />
    </>
  );
}
