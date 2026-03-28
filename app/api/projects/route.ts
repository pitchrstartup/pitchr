import { prisma } from "@/lib/prisma";
import type { ProjectListItem } from "@/lib/project-dto";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 60;

function parseBoolean(value: string | null): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get("category")?.trim();
  const hasCreator = parseBoolean(searchParams.get("hasCreator"));
  const twitterVerified = parseBoolean(searchParams.get("twitterVerified"));

  const limitRaw = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(MAX_LIMIT, Math.trunc(limitRaw)))
    : DEFAULT_LIMIT;

  const where = {
    ...(category ? { category } : {}),
    ...(typeof hasCreator === "boolean" ? { hasLaunchCreator: hasCreator } : {}),
    ...(typeof twitterVerified === "boolean" ? { twitterVerified } : {}),
  };

  const projects = await prisma.project.findMany({
    where,
    orderBy: [{ createdAtFromSource: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      slug: true,
      name: true,
      description: true,
      category: true,
      iconUrl: true,
      twitterUsername: true,
      twitterVerified: true,
      hasLaunchCreator: true,
      createdAtFromSource: true,
    },
  });

  const payload: ProjectListItem[] = projects.map((project) => ({
    ...project,
    createdAtFromSource: project.createdAtFromSource?.toISOString() ?? null,
  }));

  return Response.json({
    items: payload,
    count: payload.length,
    filters: {
      category: category ?? null,
      hasCreator: hasCreator ?? null,
      twitterVerified: twitterVerified ?? null,
      limit,
    },
  });
}
