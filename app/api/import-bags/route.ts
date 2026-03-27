import { readProjectsFromFile, importBagsProjects } from '@/lib/import-bags';
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

  console.log(`[${LOG_PREFIX}] starting`);

  try {
    step = 'reading JSON file';
    const projects = await readProjectsFromFile(INPUT_FILE);

    step = 'starting DB writes';
    const result = await importBagsProjects({ prisma, projects });

    console.log(`[${LOG_PREFIX}] finished`);

    return Response.json({
      ok: true,
      total: result.total,
      imported: result.imported,
      updated: result.updated,
      rejected: result.rejected,
      rejectedRowsSample: result.rejectedRows.slice(0, 10),
      rowErrorsSample: result.rowErrors.slice(0, 10),
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
    });

    return Response.json(
      {
        ok: false,
        error: errorMessage,
        stack: isProduction ? undefined : errorStack,
        step,
        failingStep: step,
        failingField: null,
        total: 0,
        imported: 0,
        updated: 0,
        rejected: 0,
        durationMs: Date.now() - startedAt,
      },
      { status: 500 },
    );
  }
}
