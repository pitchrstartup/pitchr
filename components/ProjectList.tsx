import type { ProjectListItem } from "@/lib/project-dto";
import { ProjectCard } from "@/components/ProjectCard";

export function ProjectList({ items }: { items: ProjectListItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((project) => (
        <ProjectCard key={project.slug} project={project} />
      ))}
    </div>
  );
}
