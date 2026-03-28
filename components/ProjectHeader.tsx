import type { ProjectDetail } from "@/lib/project-dto";

export function ProjectHeader({ project }: { project: ProjectDetail }) {
  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start gap-3">
        {project.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.iconUrl} alt={`${project.name} logo`} className="h-12 w-12 rounded-logo border border-green-100 bg-green-50" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-logo border border-green-100 bg-green-50 text-sm font-medium">
            {project.name.slice(0, 1)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-medium tracking-[-0.03em]">{project.name}</h1>
          {project.category ? <p className="mt-1 text-sm text-text-secondary">{project.category}</p> : null}

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {project.twitterVerified ? (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-blue-900">Verified</span>
            ) : null}
            {project.hasLaunchCreator ? (
              <span className="rounded-full border border-green-200 bg-green-50 px-2 py-1 text-green-900">
                Creator signal
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-text-primary">
        {project.description ?? "No description provided yet."}
      </p>
    </section>
  );
}
