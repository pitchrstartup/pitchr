import Link from "next/link";
import type { ProjectListItem } from "@/lib/project-dto";
import { ProjectBadges } from "@/components/ProjectBadges";

export function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <article className="rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="mb-4 h-[3px] rounded-full bg-back" />

      <div className="flex items-start gap-3">
        {project.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.iconUrl} alt={`${project.name} logo`} className="h-10 w-10 rounded-logo border border-green-100 bg-green-50" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-logo border border-green-100 bg-green-50 text-sm font-medium">
            {project.name.slice(0, 1)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-medium leading-5">{project.name}</h2>
          <p className="line-clamp-2 mt-1 text-sm leading-6 text-text-secondary">
            {project.description ?? "No description provided yet."}
          </p>

          {project.twitterUsername ? (
            <p className="mt-1 text-xs text-text-secondary">@{project.twitterUsername}</p>
          ) : null}

          <ProjectBadges project={project} />
        </div>
      </div>

      <Link
        href={`/projects/${project.slug}`}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-button border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
      >
        View project
      </Link>
    </article>
  );
}
