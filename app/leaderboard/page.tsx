import { Navigation } from "@/components/Navigation";

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-background text-text-primary">
      <Navigation />
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="mt-3 text-text-secondary">Static placeholder page. No rankings connected.</p>
      </section>
    </main>
  );
}
