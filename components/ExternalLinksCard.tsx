import type { ProjectDetail } from "@/lib/project-dto";

export function ExternalLinksCard({ project }: { project: ProjectDetail }) {
  if (!project.sourceUrl && !project.twitterUrl) return null;

  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <h2 className="text-lg font-medium tracking-[-0.02em]">Links</h2>
      <div className="mt-3 flex flex-col gap-2 text-sm">
        {project.sourceUrl ? (
          <a
            href={project.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="min-h-12 rounded-button border border-border px-3 py-3 hover:bg-gray-50"
          >
            Open source page
          </a>
        ) : null}

        {project.twitterUrl ? (
          <a
            href={project.twitterUrl}
            target="_blank"
            rel="noreferrer"
            className="min-h-12 rounded-button border border-border px-3 py-3 hover:bg-gray-50"
          >
            Open X profile
          </a>
        ) : null}
      </div>
    </section>
  );
}
