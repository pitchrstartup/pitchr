import Link from "next/link";

export function Navigation() {
  return (
    <nav className="border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-text-primary">
          Pitchr
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium text-text-secondary">
          <Link href="/discover" className="hover:text-text-primary">
            Discover
          </Link>
          <Link href="/leaderboard" className="hover:text-text-primary">
            Leaderboard
          </Link>
        </div>
      </div>
    </nav>
  );
}
