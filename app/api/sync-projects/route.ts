import { syncProjectsFromImported } from '@/lib/sync-projects';
import { prisma } from '@/lib/prisma';
import { requireCronBearerAuth } from '@/lib/cron-auth';

export const runtime = 'nodejs';

const LOG_PREFIX = 'cron-sync-projects';

export async function POST(request: Request) {
  const startedAt = Date.now();

  const authError = requireCronBearerAuth(request, LOG_PREFIX);
  if (authError) return authError;

  console.log(`[${LOG_PREFIX}] starting`);

  try {
    const result = await syncProjectsFromImported({ prisma });

    console.log(`[${LOG_PREFIX}] finished`);

    return Response.json({
      ok: true,
      ...result,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(`[${LOG_PREFIX}] failed`, {
      error: errorMessage,
      stack: errorStack,
    });

    return Response.json(
      {
        ok: false,
        error: errorMessage,
        stack: isProduction ? undefined : errorStack,
        total: 0,
        imported: 0,
        updated: 0,
        rejected: 0,
        rejectedRowsSample: [],
        durationMs: Date.now() - startedAt,
      },
      { status: 500 },
    );
  }
}
