import { prisma } from "@/lib/prisma";
import type { ProjectDetail } from "@/lib/project-dto";

type Context = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: Context) {
  const { slug } = await context.params;

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

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const payload: ProjectDetail = {
    ...project,
    createdAtFromSource: project.createdAtFromSource?.toISOString() ?? null,
  };

  return Response.json(payload);
}
