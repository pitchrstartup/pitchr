import { importBagsProjectUpdates } from '@/lib/import-bags-updates';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST() {
  const startedAt = Date.now();
  let step = 'starting updates import';

  console.log('[import-updates] starting');

  try {
    step = 'importing updates';
    const result = await importBagsProjectUpdates({ prisma });

    console.log('[import-updates] finished');

    return Response.json({
      ok: true,
      totalProjects: result.projectsProcessed,
      totalUpdatesFetched: result.totalUpdatesFetched,
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

    console.error('[import-updates] failed', {
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
      },
      { status: 500 },
    );
  }
}
