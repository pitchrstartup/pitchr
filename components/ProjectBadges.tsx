import type { ProjectListItem } from "@/lib/project-dto";

function isRecent(isoDate: string | null): boolean {
  if (!isoDate) return false;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return false;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - parsed.getTime() <= sevenDaysMs;
}

export function ProjectBadges({ project }: { project: ProjectListItem }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {project.category ? (
        <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-900">
          {project.category}
        </span>
      ) : null}

      {project.twitterVerified ? (
        <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-900">
          Verified
        </span>
      ) : null}

      {project.hasLaunchCreator ? (
        <span className="rounded-full border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-900">
          Creator signal
        </span>
      ) : null}

      {isRecent(project.createdAtFromSource) ? (
        <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-900">New</span>
      ) : null}
    </div>
  );
}
