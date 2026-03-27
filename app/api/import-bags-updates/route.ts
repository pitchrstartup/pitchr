import { importBagsProjectUpdates } from '@/lib/import-bags-updates';
import { prisma } from '@/lib/prisma';
import { requireCronBearerAuth } from '@/lib/cron-auth';

export const runtime = 'nodejs';

const LOG_PREFIX = 'cron-import-updates';

export async function POST(request: Request) {
  const startedAt = Date.now();
  let step = 'starting updates import';

  const authError = requireCronBearerAuth(request, LOG_PREFIX);
  if (authError) return authError;

  console.log(`[${LOG_PREFIX}] starting`);

  try {
    step = 'importing updates';
    const result = await importBagsProjectUpdates({ prisma });

    console.log(`[${LOG_PREFIX}] finished`);

    return Response.json({
      ok: true,
      total: result.totalUpdatesFetched,
      totalProjects: result.projectsProcessed,
      totalUpdatesFetched: result.totalUpdatesFetched,
      imported: result.imported,
      updated: result.updated,
      rejected: result.rejected,
      sampleUpdates: result.sample.slice(0, 5),
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
        step,
        error: errorMessage,
        stack: isProduction ? undefined : errorStack,
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
