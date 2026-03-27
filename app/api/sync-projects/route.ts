import { syncProjectsFromImported } from '@/lib/sync-projects';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST() {
  const startedAt = Date.now();

  try {
    const result = await syncProjectsFromImported({ prisma });

    return Response.json({
      ok: true,
      ...result,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

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
