import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-text-primary">
      <Navigation />
      <section className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-16">
        <h1 className="text-4xl font-black">Pitchr</h1>
        <p className="text-text-secondary">Empty base ready for rebuild.</p>
        <div className="flex gap-3">
          <Link href="/discover" className="rounded-lg border border-border px-4 py-2">
            Discover
          </Link>
          <Link href="/leaderboard" className="rounded-lg border border-border px-4 py-2">
            Leaderboard
          </Link>
        </div>
      </section>
    </main>
  );
}
