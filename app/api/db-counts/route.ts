import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [
      importedProject,
      importedProjectUpdate,
      importedTokenMetrics,
      project,
      creator,
      token,
      projectCreator,
      projectToken,
      importCursor,
      importedProjectNoTwitter,
      importedProjectWithToken,
      projectHasToken,
      projectHasLinkedCreator,
      projectHasUpdates,
      cursors,
    ] = await Promise.all([
      prisma.importedProject.count(),
      prisma.importedProjectUpdate.count(),
      prisma.importedTokenMetrics.count(),
      prisma.project.count(),
      prisma.creator.count(),
      prisma.token.count(),
      prisma.projectCreator.count(),
      prisma.projectToken.count(),
      prisma.importCursor.count(),
      prisma.importedProject.count({ where: { twitterUserId: null } }),
      prisma.importedProject.count({ where: { tokenAddress: { not: null } } }),
      prisma.project.count({ where: { hasToken: true } }),
      prisma.project.count({ where: { hasLinkedCreator: true } }),
      prisma.project.count({ where: { updatesCount: { gt: 0 } } }),
      prisma.importCursor.findMany({ select: { key: true, cursor: true, updatedAt: true } }),
    ]);

    return NextResponse.json({
      counts: {
        ImportedProject: importedProject,
        ImportedProjectUpdate: importedProjectUpdate,
        ImportedTokenMetrics: importedTokenMetrics,
        Project: project,
        Creator: creator,
        Token: token,
        ProjectCreator: projectCreator,
        ProjectToken: projectToken,
        ImportCursor: importCursor,
      },
      filters: {
        "ImportedProject WHERE twitterUserId IS NULL": importedProjectNoTwitter,
        "ImportedProject WHERE tokenAddress IS NOT NULL": importedProjectWithToken,
        "Project WHERE hasToken = true": projectHasToken,
        "Project WHERE hasLinkedCreator = true": projectHasLinkedCreator,
        "Project WHERE updatesCount > 0": projectHasUpdates,
      },
      cursors,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
