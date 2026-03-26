import { readProjectsFromFile, importBagsProjects } from '@/lib/import-bags';
import { prisma } from '@/lib/prisma';

const INPUT_FILE = 'data/bags-projects.raw.json';

export async function POST() {
  const startedAt = Date.now();

  try {
    const projects = await readProjectsFromFile(INPUT_FILE);
    const result = await importBagsProjects({ prisma, projects });

    return Response.json({
      ok: true,
      total: result.total,
      imported: result.imported,
      updated: result.updated,
      rejected: result.rejected,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        total: 0,
        imported: 0,
        updated: 0,
        rejected: 0,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
