import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export default function HomePage() {
  return (
    <main className="min-h-[100dvh] bg-background pb-24 lg:pb-0">
      <Navigation />

      <section className="flex min-h-[100dvh] flex-col justify-center px-5 pt-6 text-center lg:mx-auto lg:max-w-5xl lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Pitchr × Bags.fm Hackathon</p>
        <h1 className="mt-4 text-4xl font-black leading-tight text-text-primary sm:text-5xl">
          Swipe through the boldest Solana hackathon projects.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg">
          Discover standout builders, support your favorites, and see which projects the community feels most bullish on.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/discover"
            className="flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-base font-semibold text-white"
          >
            Start Swiping
          </Link>
          <Link
            href="/leaderboard"
            className="flex min-h-12 items-center justify-center rounded-xl border border-border bg-surface px-6 text-base font-semibold text-text-primary"
          >
            View Leaderboard
          </Link>
        </div>
      </section>
    </main>
  );
}
