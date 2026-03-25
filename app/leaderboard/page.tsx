import { getLeaderboard } from "@/actions/projects";
import { Navigation } from "@/components/Navigation";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const projects = await getLeaderboard();

  return (
    <main className="min-h-[100dvh] bg-background pb-24 lg:pb-8">
      <Navigation />

      <section className="mx-auto w-full px-3 pt-6 lg:max-w-2xl lg:px-0 lg:pt-10">
        <h1 className="text-2xl font-bold text-text-primary">Leaderboard</h1>
        <p className="mt-1 text-sm text-text-secondary">Ranked by RIGHT swipes</p>

        <div className="mt-4 space-y-2">
          {projects.map((project, index) => {
            const rightCount = project.swipes.filter((swipe) => swipe.direction === "RIGHT").length;
            const total = project._count.swipes;
            const bullish = total > 0 ? Math.round((rightCount / total) * 100) : 0;

            return (
              <article key={project.id} className="flex min-h-16 items-center gap-3 rounded-card border border-border bg-surface px-3 py-3">
                <div className="w-7 text-center text-sm font-bold text-text-secondary">#{index + 1}</div>

                <img
                  src={project.logoUrl ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(project.name)}`}
                  alt={`${project.name} logo`}
                  className="h-10 w-10 rounded-xl border border-border object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">{project.name}</p>
                  <p className="truncate text-xs text-text-secondary">{project.tagline}</p>
                  <p className="text-xs text-text-secondary/70">by {project.builderName}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-text-primary">{rightCount} RIGHT</p>
                  <p className="text-xs text-text-secondary">{bullish}% bullish</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
