import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ImportedProjectsInternalPage() {
  const projects = await prisma.importedProject.findMany({
    where: { source: "bags_hackathon" },
    orderBy: [{ lastSyncedAt: "desc" }],
    take: 200,
  });

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <h1 className="mb-2 text-2xl font-semibold">Internal: Imported Bags Projects</h1>
      <p className="mb-6 text-sm text-white/60">
        Verification surface for ingestion quality before public cards/profiles.
      </p>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">sourceProjectId</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Icon</th>
              <th className="px-3 py-2">Twitter</th>
              <th className="px-3 py-2">Token</th>
              <th className="px-3 py-2">Votes</th>
              <th className="px-3 py-2">Last Synced</th>
              <th className="px-3 py-2">Gaps</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const gaps = [
                !project.name ? "name" : null,
                !project.description ? "description" : null,
                !project.category ? "category" : null,
                !project.iconUrl ? "icon" : null,
              ].filter(Boolean);

              return (
                <tr key={project.id} className="border-t border-white/10 align-top">
                  <td className="px-3 py-2">{project.name ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{project.sourceProjectId}</td>
                  <td className="px-3 py-2">{project.sourceStatus ?? "—"}</td>
                  <td className="px-3 py-2">{project.category ?? "—"}</td>
                  <td className="px-3 py-2">{project.iconUrl ? "yes" : "no"}</td>
                  <td className="px-3 py-2">{project.twitterUrl ? "yes" : "no"}</td>
                  <td className="px-3 py-2">{project.tokenAddress ? "yes" : "no"}</td>
                  <td className="px-3 py-2">
                    {project.upvotes ?? 0}/{project.downvotes ?? 0}
                  </td>
                  <td className="px-3 py-2">{project.lastSyncedAt.toISOString()}</td>
                  <td className="px-3 py-2 text-xs text-yellow-300">{gaps.length ? gaps.join(", ") : "none"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
