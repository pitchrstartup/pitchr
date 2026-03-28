import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function HomePage() {
  return (
    <AppShell>
      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <h1 className="text-[40px] font-medium tracking-[-0.04em]">Back. Pass. Win.</h1>
        <p className="mt-2 text-sm text-text-secondary">Pitchr helps you discover hackathon projects with clear signals.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/discover"
            className="inline-flex min-h-12 items-center justify-center rounded-button bg-back px-4 py-2 text-sm font-medium text-green-950 hover:bg-back-strong"
          >
            Discover projects
          </Link>
          <Link
            href="/leaderboard"
            className="inline-flex min-h-12 items-center justify-center rounded-button border border-border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Leaderboard
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
