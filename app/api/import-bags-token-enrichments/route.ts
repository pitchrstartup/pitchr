import { importBagsTokenEnrichments } from '@/lib/import-bags-token-enrichments';
import { prisma } from '@/lib/prisma';
import { requireCronBearerAuth } from '@/lib/cron-auth';

export const runtime = 'nodejs';

const LOG_PREFIX = 'cron-import-token-enrichments';

export async function POST(request: Request) {
  const startedAt = Date.now();
  let step = 'starting token enrichments import';

  const authError = requireCronBearerAuth(request, LOG_PREFIX);
  if (authError) return authError;

  console.log(`[${LOG_PREFIX}] starting`);

  try {
    step = 'importing token enrichments';
    const result = await importBagsTokenEnrichments({ prisma });

    console.log(`[${LOG_PREFIX}] finished`, {
      projectsProcessed: result.projectsProcessed,
      tokensProcessed: result.tokensProcessed,
      inserted: result.inserted,
      updated: result.updated,
      failed: result.failed,
      noData: result.noData,
      partialFailures: result.partialFailures,
      nextCursor: result.nextCursor,
    });

    return Response.json({
      ok: true,
      batchSize: result.batchSize,
      totalProjects: result.totalProjects,
      projectsProcessed: result.projectsProcessed,
      tokensProcessed: result.tokensProcessed,
      inserted: result.inserted,
      updated: result.updated,
      failed: result.failed,
      noData: result.noData,
      partialFailures: result.partialFailures,
      cursor: result.cursor,
      nextCursor: result.nextCursor,
      cursorAdvanced: result.cursorAdvanced,
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
        batchSize: 0,
        totalProjects: 0,
        projectsProcessed: 0,
        tokensProcessed: 0,
        inserted: 0,
        updated: 0,
        failed: 0,
        noData: 0,
        partialFailures: 0,
        cursor: null,
        nextCursor: null,
        cursorAdvanced: false,
        durationMs: Date.now() - startedAt,
      },
      { status: 500 },
    );
  }
}
