import { getProjects } from "@/actions/projects";
import { ProjectCard } from "@/components/ProjectCard";
import { Navbar } from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const projects = await getProjects();

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Discover Projects</h1>
          <p className="text-sm text-text-secondary mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""} in the Bags Hackathon
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 text-text-secondary">
            No projects yet — check back soon!
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project.id} className="h-[400px]">
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
