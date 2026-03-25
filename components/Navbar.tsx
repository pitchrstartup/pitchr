import Link from "next/link";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-text-primary">Pitchr</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/discover"
            className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface"
          >
            Discover
          </Link>
          <Link
            href="/leaderboard"
            className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface"
          >
            Leaderboard
          </Link>
        </div>
      </div>
    </nav>
  );
}
