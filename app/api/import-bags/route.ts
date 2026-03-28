import { loadBagsProjects, importBagsProjects } from '@/lib/import-bags';
import { prisma } from '@/lib/prisma';
import { requireCronBearerAuth } from '@/lib/cron-auth';

export const runtime = 'nodejs';

const INPUT_FILE = 'data/bags-projects.raw.json';
const LOG_PREFIX = 'cron-import-projects';

export async function POST(request: Request) {
  const startedAt = Date.now();
  let step = 'starting import';

  const authError = requireCronBearerAuth(request, LOG_PREFIX);
  if (authError) return authError;

  const inputMode = process.env.BAGS_PROJECTS_INPUT_MODE ?? 'auto';

  console.log(`[${LOG_PREFIX}] starting`, { inputMode, inputFile: INPUT_FILE });

  try {
    step = 'loading projects from configured source';
    const loaded = await loadBagsProjects({
      inputFile: INPUT_FILE,
      inputMode,
    });

    console.log(`[${LOG_PREFIX}] source resolved`, {
      source: loaded.source,
      totalProjects: loaded.projects.length,
    });

    step = 'writing imported projects';
    const result = await importBagsProjects({ prisma, projects: loaded.projects });

    console.log(`[${LOG_PREFIX}] finished`, {
      source: loaded.source,
      imported: result.imported,
      updated: result.updated,
      rejected: result.rejected,
    });

    return Response.json({
      ok: true,
      inputMode,
      source: loaded.source,
      totalFetched: loaded.projects.length,
      totalValid: result.valid,
      imported: result.imported,
      updated: result.updated,
      rejected: result.rejected,
      rejectedRowsSample: result.rejectedRows.slice(0, 10),
      rowErrorsSample: result.rowErrors.slice(0, 10),
      sourceMeta: loaded.meta,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(`[${LOG_PREFIX}] failed`, {
      step,
      error: errorMessage,
      stack: errorStack,
      inputMode,
      inputFile: INPUT_FILE,
    });

    return Response.json(
      {
        ok: false,
        error: errorMessage,
        stack: isProduction ? undefined : errorStack,
        step,
        failingStep: step,
        failingField: null,
        source: null,
        totalFetched: 0,
        totalValid: 0,
        imported: 0,
        updated: 0,
        rejected: 0,
        durationMs: Date.now() - startedAt,
      },
      { status: 500 },
    );
  }
}
