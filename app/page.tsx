import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-8">
            Bags.fm Hackathon
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-text-primary leading-tight mb-6">
            Discover
            <br />
            <span className="text-accent">hackathon projects</span>
          </h1>

          <p className="text-lg text-text-secondary mb-10 leading-relaxed">
            Browse all projects built for the Bags.fm Hackathon.
            <br />
            Back the ones you believe in.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/discover"
              className="px-8 py-4 bg-accent text-white rounded-xl font-semibold text-base hover:bg-indigo-500 transition-colors"
            >
              Browse Projects
            </Link>
            <Link
              href="/leaderboard"
              className="px-8 py-4 bg-surface-2 text-text-primary rounded-xl font-semibold text-base hover:bg-border transition-colors border border-border"
            >
              View Leaderboard
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="bg-surface border border-border rounded-card p-5">
              <div className="text-2xl mb-3">🏗️</div>
              <h3 className="font-semibold text-text-primary mb-1">10 Projects</h3>
              <p className="text-sm text-text-secondary">
                Real builder submissions from the Bags.fm hackathon, each with a Solana angle.
              </p>
            </div>
            <div className="bg-surface border border-border rounded-card p-5">
              <div className="text-2xl mb-3">👀</div>
              <h3 className="font-semibold text-text-primary mb-1">Browse & Explore</h3>
              <p className="text-sm text-text-secondary">
                Flip through project cards, read the pitches, visit builder profiles.
              </p>
            </div>
            <div className="bg-surface border border-border rounded-card p-5">
              <div className="text-2xl mb-3">🏆</div>
              <h3 className="font-semibold text-text-primary mb-1">Leaderboard</h3>
              <p className="text-sm text-text-secondary">
                See all projects ranked. Voting and community support coming soon.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
