import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { ProjectHeader } from "@/components/ProjectHeader";
import { ExternalLinksCard } from "@/components/ExternalLinksCard";
import { SignalsGrid } from "@/components/SignalsGrid";
import { CtaArea } from "@/components/CtaArea";
import type { ProjectDetail } from "@/lib/project-dto";

type ProjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getProject(slug: string): Promise<ProjectDetail | null> {
  const project = await prisma.project.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      description: true,
      category: true,
      iconUrl: true,
      sourceUrl: true,
      twitterUrl: true,
      twitterUsername: true,
      twitterVerified: true,
      hasLaunchCreator: true,
      tokenAddress: true,
      claimsUniqueWallets: true,
      creatorCount: true,
      twitterFollowersCount: true,
      twitterFollowingCount: true,
      createdAtFromSource: true,
    },
  });

  if (!project) return null;

  return {
    ...project,
    createdAtFromSource: project.createdAtFromSource?.toISOString() ?? null,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <AppShell>
      <div className="grid grid-cols-1 gap-4">
        <ProjectHeader project={project} />
        <ExternalLinksCard project={project} />
        <SignalsGrid project={project} />
        <CtaArea />
      </div>
    </AppShell>
  );
}
