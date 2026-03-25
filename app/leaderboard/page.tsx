import { getProjects } from "@/actions/projects";
import { Navbar } from "@/components/Navbar";
import type { Project } from "@/types";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const projects = await getProjects();

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Leaderboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            All Bags Hackathon projects
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 text-text-secondary">
            No projects yet — check back soon!
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project, index) => (
              <ProjectRow key={project.id} project={project} rank={index + 1} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function ProjectRow({ project, rank }: { project: Project; rank: number }) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

  return (
    <div className="bg-surface border border-border rounded-card p-5 flex items-center gap-4">
      <div className="w-8 text-center shrink-0">
        {medal ? (
          <span className="text-xl">{medal}</span>
        ) : (
          <span className="text-sm font-bold text-text-secondary">#{rank}</span>
        )}
      </div>

      {project.logoUrl ? (
        <img
          src={project.logoUrl}
          alt={`${project.name} logo`}
          className="w-10 h-10 rounded-xl object-cover shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
          <span className="text-accent font-bold text-base">{project.name[0]}</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-text-primary">{project.name}</h3>
          {project.twitterUrl && (
            <a href={project.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
              X
            </a>
          )}
          {project.websiteUrl && (
            <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
              Site
            </a>
          )}
        </div>
        <p className="text-xs text-text-secondary truncate">{project.tagline}</p>
        <p className="text-xs text-text-secondary/60 mt-0.5">by {project.builderName}</p>
      </div>
    </div>
  );
}
