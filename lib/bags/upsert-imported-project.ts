import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ImportedProjectInput } from "@/lib/bags/types";

function toPrismaJson(value: unknown) {
  if (value === null || value === undefined) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

export async function upsertImportedProject(project: ImportedProjectInput): Promise<"created" | "updated"> {
  const existing = await prisma.importedProject.findUnique({
    where: {
      source_sourceProjectId: {
        source: project.source,
        sourceProjectId: project.sourceProjectId,
      },
    },
    select: { id: true },
  });

  await prisma.importedProject.upsert({
    where: {
      source_sourceProjectId: {
        source: project.source,
        sourceProjectId: project.sourceProjectId,
      },
    },
    create: {
      ...project,
      rawListPayload: toPrismaJson(project.rawListPayload),
      rawDetailPayload: toPrismaJson(project.rawDetailPayload),
      lastSyncedAt: new Date(),
    },
    update: {
      ...project,
      rawListPayload: toPrismaJson(project.rawListPayload),
      rawDetailPayload: toPrismaJson(project.rawDetailPayload),
      lastSyncedAt: new Date(),
    },
  });

  return existing ? "updated" : "created";
}
