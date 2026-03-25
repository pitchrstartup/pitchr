import type { Project } from "@prisma/client";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="flex h-full w-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="flex justify-center px-6 pt-8">
        {project.logoUrl ? (
          <img
            src={project.logoUrl}
            alt={`${project.name} logo`}
            className="h-24 w-24 rounded-3xl border border-border object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-border bg-surface-2 text-3xl font-bold text-accent">
            {project.name[0]}
          </div>
        )}
      </div>

      <div className="px-6 pb-4 pt-6 text-center">
        <h2 className="text-2xl font-bold text-text-primary">{project.name}</h2>
        <p className="mt-2 text-sm text-accent">{project.tagline}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <p className="text-sm leading-relaxed text-text-secondary">{project.description}</p>
      </div>

      <div className="mt-auto border-t border-border px-6 py-4">
        <div className="flex items-center gap-2">
          {project.builderAvatar ? (
            <img
              src={project.builderAvatar}
              alt={`${project.builderName} avatar`}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-text-secondary">
              {project.builderName[0]}
            </div>
          )}
          <span className="text-sm font-medium text-text-primary">{project.builderName}</span>
        </div>

        <div className="mt-3 flex items-center gap-3 text-sm">
          {project.twitterUrl && (
            <a href={project.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline-offset-2 hover:underline">
              Twitter
            </a>
          )}
          {project.websiteUrl && (
            <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline-offset-2 hover:underline">
              Website
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
