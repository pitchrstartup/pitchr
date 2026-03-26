import { access, stat } from 'node:fs/promises';
import path from 'node:path';

import { readProjectsFromFile, importBagsProjects } from '@/lib/import-bags';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const INPUT_FILE = 'data/bags-projects.raw.json';

export async function POST() {
  const startedAt = Date.now();
  let step = 'starting import';

  console.log('[import-bags] starting import');

  try {
    step = 'reading JSON file';
    console.log('[import-bags] reading JSON file');

    const absoluteInputPath = path.resolve(process.cwd(), INPUT_FILE);
    console.log('[import-bags] input file path', absoluteInputPath);

    let fileExists = false;
    let fileSizeBytes: number | null = null;

    try {
      await access(absoluteInputPath);
      fileExists = true;
      const fileStats = await stat(absoluteInputPath);
      fileSizeBytes = fileStats.size;
    } catch {
      fileExists = false;
    }

    console.log('[import-bags] input file exists', fileExists);
    console.log('[import-bags] input file size bytes', fileSizeBytes);

    const projects = await readProjectsFromFile(INPUT_FILE);
    console.log('[import-bags] JSON loaded');

    step = 'starting normalization';
    console.log('[import-bags] starting normalization');

    step = 'starting DB writes';
    console.log('[import-bags] starting DB writes');

    const result = await importBagsProjects({ prisma, projects });

    step = 'finished import';
    console.log('[import-bags] finished import');

    return Response.json({
      ok: true,
      total: result.total,
      imported: result.imported,
      updated: result.updated,
      rejected: result.rejected,
      payloadAudit: result.payloadAudit,
      rejectedRowsSample: result.rejectedRows.slice(0, 10),
      rowErrorsSample: result.rowErrors.slice(0, 10),
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('[import-bags] import failed', {
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
